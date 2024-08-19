"""Defines CRUD interface for handling user-uploaded URDFs.

This simply sits on top of the ArtifactsCrud and provides a more specific
interface for handling URDFs.
"""

import asyncio
import io
import logging
import tarfile
from typing import IO, Iterator
from xml.etree import ElementTree as ET

import trimesh
from boto3.dynamodb.conditions import Attr
from fastapi import UploadFile

from store.app.crud.artifacts import MESH_SAVE_TYPE, ArtifactsCrud
from store.app.errors import BadArtifactError
from store.app.model import (
    Artifact,
    Listing,
)
from store.utils import save_xml

logger = logging.getLogger(__name__)

URDF_PACKAGE_NAME = "droid.tgz"


def iter_tar_components(file: IO[bytes]) -> Iterator[tuple[str, IO[bytes]]]:
    """Iterates over the components of a tar file.

    Args:
        file: The tar file to iterate over.

    Yields:
        A tuple containing the name of the component and its contents.
    """
    with tarfile.open(fileobj=file, mode="r:gz") as tar:
        for member in tar.getmembers():
            if member.isfile() and (data := tar.extractfile(member)) is not None:
                with data:
                    yield member.name, data


class UrdfCrud(ArtifactsCrud):
    async def set_urdf(
        self,
        file: UploadFile,
        listing: Listing,
        description: str | None = None,
    ) -> Artifact:
        # Removes any existing URDF.
        await self.remove_urdf(listing.id)

        # Unpacks the TAR file, getting meshes and URDFs.
        urdf: tuple[str, ET.ElementTree] | None = None
        meshes: list[tuple[str, trimesh.Trimesh]] = []
        tar_data = await file.read()
        for name, data in iter_tar_components(io.BytesIO(tar_data)):
            suffix = name.lower().split(".")[-1]
            if suffix == "urdf":
                if urdf is not None:
                    raise BadArtifactError("Multiple URDF files found in TAR.")
                try:
                    urdf_tree = ET.parse(io.BytesIO(data.read()))
                except Exception:
                    raise BadArtifactError("Invalid XML file")
                urdf = name, urdf_tree

            elif suffix in ("stl", "ply", "obj", "dae"):
                tmesh = trimesh.load(data, file_type=suffix)
                if not isinstance(tmesh, trimesh.Trimesh):
                    raise BadArtifactError(f"Invalid mesh file: {name}")
                meshes.append((name, tmesh))

            else:
                raise BadArtifactError(f"Unknown file type: {name}")

        if urdf is None:
            raise BadArtifactError("No URDF file found in TAR.")
        urdf_name, urdf_tree = urdf

        # Checks that all of the mesh files are referenced.
        mesh_names = {name for name, _ in meshes}
        for mesh in urdf_tree.iter("mesh"):
            if (filename := mesh.get("filename")) is None:
                raise BadArtifactError("Mesh element missing filename attribute.")
            if filename not in mesh_names:
                raise BadArtifactError(f"Mesh referenced in URDF was not uploaded: {filename}")
            mesh_names.remove(filename)
            mesh.set("filename", f"{filename.rsplit('.', 1)[0]}.obj")
        if mesh_names:
            raise BadArtifactError(f"Mesh files uploaded were not referenced: {mesh_names}")

        # Saves everything to a new TAR file, using OBJ files for meshes.
        tgz_out_file = io.BytesIO()
        with tarfile.open(fileobj=tgz_out_file, mode="w:gz") as tar:
            for name, tmesh in meshes:
                out_file = io.BytesIO()
                tmesh.export(out_file, file_type=MESH_SAVE_TYPE)
                info = tarfile.TarInfo(name)
                info.size = out_file.tell()
                out_file.seek(0)
                tar.addfile(info, out_file)
            urdf_out_file = io.BytesIO()
            save_xml(urdf_out_file, urdf_tree)
            urdf_out_file.seek(0)
            info = tarfile.TarInfo(urdf_name)
            info.size = len(urdf_out_file.getbuffer())
            tar.addfile(info, urdf_out_file)

        # Saves the TAR file to S3.
        tgz_out_file.seek(0)
        return await self._upload_and_store(URDF_PACKAGE_NAME, tgz_out_file, listing, "tgz", description)

    async def get_urdf(self, listing_id: str) -> Artifact | None:
        artifacts = await self.get_listing_artifacts(
            listing_id=listing_id,
            additional_filter_expression=Attr("name").eq(URDF_PACKAGE_NAME),
        )
        # If we ever end up in a situation where there are more than one URDFs,
        # we have a problem and need to delete the extra ones.
        if len(artifacts) > 2:
            await asyncio.gather(*(self.remove_artifact(artifact) for artifact in artifacts[1:]))
        return artifacts[0] if artifacts else None

    async def remove_urdf(self, listing_id: str) -> None:
        artifact = await self.get_urdf(listing_id)
        if artifact is not None:
            await self.remove_artifact(artifact)
