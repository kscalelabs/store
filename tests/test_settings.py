"""Tests that the configurations are all valid."""

from pathlib import Path

import store.settings


def test_all_configs_are_valid() -> None:
    assert (configs_root := (Path(store.settings.__file__).parent / "configs").resolve()).exists()
    assert len(config_files := list(configs_root.glob("*.yaml"))) > 0
    for config_file in config_files:
        store.settings._load_settings(config_file.stem)
