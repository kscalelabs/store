use serde::{Deserialize, Serialize};

// Reasoning for using this macro:
//      https://github.com/softprops/envy/issues/55
serde_with::with_prefix!(p_postgres "postgres_");
serde_with::with_prefix!(p_mail "mail_");
/// General configuration
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Config {
    /// Used for cookies as well as links included in automated emails
    pub domain: String,
    /// Configures the ports that the site runs on
    pub port: u16,
    /// Postgres database connection information
    #[serde(flatten, with = "p_postgres")]
    pub postgres: Postgres,
    /// Configures mailserver for automated mails (registration, password change, etc)
    #[serde(flatten, with = "p_mail")]
    pub mail: Mail,
}

/// Used when creating the connection pool.
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Postgres {
    /// Address of host of Postgres database.
    /// If you intend to host your Postgres database on the same machine as the website, this
    /// should be localhost.
    pub host: String,
    /// Name of the database that stores all of your store instance's data.
    pub dbname: String,
    /// Postgres username (used for access control to the database)
    pub user: String,
    /// Postgres password (used for access control to the database)
    pub password: String,
}

/// Configures automated emails
///
/// It is up to the sysadmin whether said emails should be no-reply or sent out automatically by
/// the sysadmin's email address
///
/// In case of the latter, the sysadmin will be able to read any replies.

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Mail {
    /// Domain where the mailserver is hosted.
    pub relay: String,
    /// Name that's used when sending out emails
    pub name: String,
    /// Email address used to send out automatic emails
    ///
    /// You can choose to use a noreply email, or (recommended) use a system administrator's email
    /// address that someone actually checks
    pub email: String,
    /// Password to the email address that sends automated emails
    pub password: String,
}

impl Config {
    /// Gets configuration from the designated configuration path (see the config_path function)
    pub fn get() -> Self {
        envy::from_env::<Config>().unwrap()
    }
}
