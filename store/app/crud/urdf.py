"""Defines CRUD interface for handling user-uploaded URDFs.

This simply sits on top of the ArtifactsCrud and provides a more specific
interface for handling URDFs.
"""

import asyncio
import io
import logging
import os
import tarfile
import zipfile
from pathlib import Path
from typing import IO, Iterator
from xml.etree import ElementTree as ET

import trimesh
from boto3.dynamodb.conditions import Attr
from fastapi import UploadFile

from store.app.crud.artifacts import ArtifactsCrud
from store.app.errors import BadArtifactError
from store.app.model import Artifact, CompressedArtifactType, Listing
from store.app.utils.convert import urdf_to_mjcf
from store.utils import save_xml

logger = logging.getLogger(__name__)


URDF_PACKAGE_NAME = "droid.tgz"


def iter_components(file: IO[bytes], compression_type: CompressedArtifactType) -> Iterator[tuple[str, IO[bytes]]]:
    """Iterates over the components of a tar file.

    Args:
        file: The tar file to iterate over.
        compression_type: The type of compression used for the file.

    Yields:
        A tuple containing the name of the component and its contents.
    """
    match compression_type:
        case "zip":
            with zipfile.ZipFile(file) as zipf:
                for name in zipf.namelist():
                    # Fix for MacOS.
                    if name.startswith("__MACOS"):
                        continue
                    # Ignore folders.
                    if name.endswith("/"):
                        continue
                    with zipf.open(name) as zipdata:
                        yield name, zipdata

        case "tgz":
            with tarfile.open(fileobj=file, mode="r:gz") as tar:
                for member in tar.getmembers():
                    if member.isfile() and (tardata := tar.extractfile(member)) is not None:
                        with tardata:
                            yield member.name, tardata

        case _:
            raise ValueError(f"Unknown compression type: {compression_type}")


class UrdfCrud(ArtifactsCrud):
    async def set_urdf(
        self,
        file: UploadFile,
        listing: Listing,
        compression_type: CompressedArtifactType,
        description: str | None = None,
    ) -> Artifact:
        # Unpacks the TAR file, getting meshes and URDFs.
        urdf: tuple[str, ET.ElementTree] | None = None
        mjcf: tuple[str, ET.ElementTree] | None = None
        meshes: list[tuple[str, trimesh.Trimesh]] = []

        compressed_data = await file.read()
        for name, data in iter_components(io.BytesIO(compressed_data), compression_type):
            suffix = name.lower().split(".")[-1]

            if suffix == "urdf":
                if urdf is not None:
                    raise BadArtifactError("Multiple URDF files found in TAR.")
                try:
                    urdf_tree = ET.parse(io.BytesIO(data.read()))
                except Exception:
                    raise BadArtifactError("Invalid XML file")
                urdf = name, urdf_tree

            elif suffix == "xml":
                if mjcf is not None:
                    raise BadArtifactError("Multiple MJCF files found in TAR.")
                try:
                    mjcf_tree = ET.parse(io.BytesIO(data.read()))
                except Exception:
                    raise BadArtifactError("Invalid XML file")
                mjcf = name, mjcf_tree

            elif suffix in ("stl", "ply", "obj", "dae"):
                try:
                    tmesh = trimesh.load(data, file_type=suffix)
                    assert isinstance(tmesh, trimesh.Trimesh)
                except Exception:
                    raise BadArtifactError(f"Invalid mesh file: {name}")
                meshes.append((name, tmesh))

            else:
                raise BadArtifactError(f"Unknown file type: {name}")

        if urdf is None and mjcf is None:
            raise BadArtifactError("No URDF or MJCF file found in TAR.")

        if urdf is None:
            raise BadArtifactError("URDF -> MJCF is not supported yet.")
            # mjcf_name, mjcf_tree = mjcf
            # urdf_name, urdf_tree = os.path.splitext(urdf_name)[0] + ".urdf", mjcf_to_urdf(urdf_tree, meshes)
            # logger.info(f"Converting MJCF to URDF: {mjcf_name} -> {urdf_name}")
        elif mjcf is None:
            urdf_name, urdf_tree = urdf

            # Generate the MJCF if it's not provided
            try:
                mjcf_name, mjcf_tree = os.path.splitext(urdf_name)[0] + ".xml", urdf_to_mjcf(urdf_tree, meshes)
                logger.info("Converting URDF to MJCF: %s -> %s", urdf_name, mjcf_name)
            except:
                raise BadArtifactError(
                    "Failed to convert URDF to MJCF. Make sure mass and inertia of moving bodies are defined."
                )
        else:
            urdf_name, urdf_tree = urdf
            mjcf_name, mjcf_tree = mjcf

        # Checks that all of the mesh files are referenced.
        mesh_names = {Path(name) for name, _ in meshes}
        mesh_references = {Path(name): False for name, _ in meshes}
        for mesh in urdf_tree.iter("mesh"):
            if (filename := mesh.get("filename")) is None:
                raise BadArtifactError("Mesh element missing filename attribute.")
            filepath = Path(filename).relative_to(".")
            if filepath not in mesh_names:
                raise BadArtifactError(f"Mesh referenced in URDF was not uploaded: {filepath}")
            mesh_references[filepath] = True
            mesh.set("filename", str(filepath.with_suffix(".obj")))

        logger.info("refs", mesh_references)
        unreferenced_meshes = [name for name, referenced in mesh_references.items() if not referenced]
        if unreferenced_meshes:
            raise BadArtifactError(f"Mesh files uploaded were not referenced: {unreferenced_meshes}")

        # Saves everything to a new TAR file, using OBJ files for meshes.
        tgz_out_file = io.BytesIO()
        with tarfile.open(fileobj=tgz_out_file, mode="w:gz") as tar:
            for name, tmesh in meshes:
                out_file = io.BytesIO()
                tmesh.export(out_file, file_type="obj")
                obj_name = Path(name).with_suffix(".obj").as_posix()
                info = tarfile.TarInfo(obj_name)
                info.size = out_file.tell()
                out_file.seek(0)
                tar.addfile(info, out_file)

            urdf_out_file = io.BytesIO()
            save_xml(urdf_out_file, urdf_tree)
            urdf_out_file.seek(0)
            info = tarfile.TarInfo(urdf_name)
            info.size = len(urdf_out_file.getbuffer())
            tar.addfile(info, urdf_out_file)

            mjcf_out_file = io.BytesIO()
            save_xml(mjcf_out_file, mjcf_tree)
            mjcf_out_file.seek(0)
            info = tarfile.TarInfo(mjcf_name)
            info.size = len(mjcf_out_file.getbuffer())
            tar.addfile(info, mjcf_out_file)

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
