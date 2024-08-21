import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, Dict

import trimesh
from pybullet_utils import bullet_client, urdfEditor

from store.app.utils.formats import mjcf


def contains_urdf_or_mjcf(folder_path: Path) -> str:
    urdf_found = False
    xml_found = False

    for file in folder_path.iterdir():
        if file.suffix == ".urdf":
            urdf_found = True
        elif file.suffix == ".xml":
            xml_found = True

    if urdf_found:
        return "urdf"
    elif xml_found:
        return "mjcf"
    else:
        return None


def urdf_to_mjcf(urdf_tree: ET.ElementTree, meshes: list[tuple[str, trimesh.Trimesh]]) -> ET.ElementTree:
    """Convert a URDF ElementTree to an MJCF ElementTree."""
    # Extract the robot name from the URDF tree
    robot_name = urdf_tree.getroot().get("name")

    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Save the URDF tree to a file
            urdf_path = Path(temp_dir) / f"{robot_name}.urdf"
            urdf_tree.write(urdf_path, encoding="utf-8")

            # Save the mesh files
            for mesh_name, mesh in meshes:
                mesh_path = Path(temp_dir) / mesh_name
                mesh.export(mesh_path)

            # Loading the URDF file and adapting it to the MJCF format
            mjcf_robot = mjcf.Robot(robot_name, temp_dir, mjcf.Compiler(angle="radian", meshdir="meshes"))
            mjcf_robot.adapt_world()

            # Save the MJCF file with the base name
            mjcf_path = urdf_path.parent / f"{robot_name}.xml"
            mjcf_robot.save(mjcf_path)

            # Read the MJCF file back into an ElementTree
            mjcf_tree = ET.parse(mjcf_path)
        except Exception as e:
            raise

    return mjcf_tree

def mjcf_to_urdf(mjcf_tree: ET.ElementTree, meshes: list[tuple[str, trimesh.Trimesh]]) -> ET.ElementTree:
    """Convert an MJCF ElementTree to a URDF ElementTree with all parts combined."""
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Save the MJCF tree to a file
            mjcf_path = Path(temp_dir) / "robot_mjcf.xml"
            mjcf_tree.write(mjcf_path, encoding="utf-8")

            # Save the mesh files in the temporary directory
            for mesh_name, mesh in meshes:
                mesh_path = Path(temp_dir) / mesh_name
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
            combined_urdf_path = temp_dir / "combined_robot.urdf"

            # Save the combined URDF
            combined_urdf_editor.saveUrdf(combined_urdf_path)

            # Read the combined URDF file back into an ElementTree
            urdf_tree = ET.parse(combined_urdf_path)

        except Exception as e:
            raise

    return urdf_tree
