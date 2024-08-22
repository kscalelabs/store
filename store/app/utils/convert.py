"""This module contains functions to convert between URDF and MJCF formats."""

import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

import trimesh
from pybullet_utils import bullet_client, urdfEditor

from store.app.utils.formats import mjcf


def urdf_to_mjcf(urdf_tree: ET.ElementTree, meshes: list[tuple[str, trimesh.Trimesh]]) -> ET.ElementTree:
    """Convert a URDF ElementTree to an MJCF ElementTree.

    This function converts a URDF file to an MJCF file. It is intended to be
    used when a URDF file is provided and an MJCF file is needed. The function
    converts the URDF file to an MJCF file and returns the MJCF file as an
    ElementTree.

    Args:
        urdf_tree: The URDF ElementTree to convert.
        meshes: A list of tuples containing the mesh file name and the mesh
            object.

    Returns:
        The MJCF ElementTree.
    """
    robot_name = urdf_tree.getroot().get("name")
    if robot_name is None:
        raise ValueError("URDF tree does not contain a robot name.")

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir_path = Path(temp_dir)

        try:
            # Save the URDF tree to a file
            urdf_path = temp_dir_path / f"{robot_name}.urdf"
            urdf_tree.write(urdf_path, encoding="utf-8")

            # Save the mesh files
            for mesh_name, mesh in meshes:
                mesh_path = temp_dir_path / mesh_name
                mesh_path.parent.mkdir(parents=True, exist_ok=True)
                mesh.export(mesh_path)

            # Loading the URDF file and adapting it to the MJCF format
            mjcf_robot = mjcf.Robot(robot_name, temp_dir, mjcf.Compiler(angle="radian", meshdir="meshes"))
            mjcf_robot.adapt_world()

            # Save the MJCF file with the base name
            mjcf_path = urdf_path.parent / f"{robot_name}.xml"
            mjcf_robot.save(mjcf_path)

            # Read the MJCF file back into an ElementTree
            mjcf_tree = ET.parse(mjcf_path)
        except Exception:
            raise

    return mjcf_tree


def mjcf_to_urdf(mjcf_tree: ET.ElementTree, meshes: list[tuple[str, trimesh.Trimesh]]) -> ET.ElementTree:
    """Convert an MJCF ElementTree to a URDF ElementTree with all parts combined.

    This function assumes that the MJCF file contains a single robot with
    multiple parts. It combines all parts into a single URDF file.

    Note that this function is not particularly good - for example, it can
    lose information about the types of joints between parts. It is intended
    as a quick and dirty way to convert MJCF files to URDF files for use in
    other tools.

    Args:
        mjcf_tree: The MJCF ElementTree to convert.
        meshes: A list of tuples containing the mesh file name and the mesh
            object.

    Returns:
        The URDF ElementTree with all parts combined.
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            temp_dir_path = Path(temp_dir)

            # Save the MJCF tree to a file
            mjcf_path = temp_dir_path / "robot_mjcf.xml"
            mjcf_tree.write(mjcf_path, encoding="utf-8")

            # Save the mesh files in the temporary directory
            for mesh_name, mesh in meshes:
                mesh_path = temp_dir_path / mesh_name
                mesh_path.parent.mkdir(parents=True, exist_ok=True)
                mesh.export(mesh_path)

            # Set up the Bullet client and load the MJCF file
            client = bullet_client.BulletClient()
            objs = client.loadMJCF(str(mjcf_path), flags=client.URDF_USE_IMPLICIT_CYLINDER)

            # Initialize a single URDF editor to store all parts
            combined_urdf_editor = urdfEditor.UrdfEditor()

            for obj in objs:
                humanoid = obj  # Get the current object
                part_urdf_editor = urdfEditor.UrdfEditor()
                part_urdf_editor.initializeFromBulletBody(humanoid, client._client)

                # Add all links from the part URDF editor to the combined editor
                for link in part_urdf_editor.urdfLinks:
                    if link not in combined_urdf_editor.urdfLinks:
                        combined_urdf_editor.urdfLinks.append(link)

                # Add all joints from the part URDF editor to the combined editor
                for joint in part_urdf_editor.urdfJoints:
                    if joint not in combined_urdf_editor.urdfJoints:
                        combined_urdf_editor.urdfJoints.append(joint)

            # Set the output path for the combined URDF file
            combined_urdf_path = temp_dir_path / "combined_robot.urdf"

            # Save the combined URDF
            combined_urdf_editor.saveUrdf(combined_urdf_path)

            # Read the combined URDF file back into an ElementTree
            urdf_tree = ET.parse(combined_urdf_path)

        except Exception:
            raise

    return urdf_tree
