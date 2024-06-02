use std::env::var_os;
use std::path::PathBuf;

/// Gets the home directory.
///
/// Used as an intermediate result for config_path and data_dir

fn home_dir() -> PathBuf {
    // If this function fails, your system is seriously messed up and the website not working is
    // the least of your worries.
    PathBuf::from(
        var_os("HOME").unwrap_or_else(|| panic!("The HOME environment variable is not set.")),
    )
}

/// Analogous to `$XDG_CONFIG_HOME/kscale-store/config.toml`
///
/// This path stores the user-edited config file

pub fn config_path() -> PathBuf {
    match var_os("XDG_CONFIG_HOME") {
        Some(s) => PathBuf::from(s).join("kscale-store/config.toml"),
        None => home_dir().join(".config/kscale-store/config.toml"),
    }
}

/// Analogous to `$XDG_DATA_HOME/kscale-store`

pub fn data_dir() -> PathBuf {
    match var_os("XDG_DATA_HOME") {
        Some(s) => PathBuf::from(s).join("kscale-store"),
        None => home_dir().join(".local/share/kscale-store"),
    }
}
