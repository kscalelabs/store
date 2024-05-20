#![allow(unused_must_use)]

use backend::config::Config;
use backend::dirs::config_path;
use std::default::Default;
use std::fs;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config: Config = Default::default();
    // We intentionally don't use the result here because we don't care if create_dir_all fails
    // because the directory already exists.
    fs::create_dir_all(config_path().parent().unwrap());
    fs::write(config_path(), toml::to_string(&config)?)?;
    Ok(())
}
