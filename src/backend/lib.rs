//! Provides backend functionality as a library
//!
//! Will be used for frontend (server-side generation)
//! and for the API

/// Contains the struct that describes the configuration file, as well as a function to read said
/// config file
pub mod config;

/// Directories where data (config, Git repositories, etc) are read
pub mod dirs;

/// Utilities to send mail
///
/// The mailer connection pool should be set up in main.rs (for the API and the site)
pub mod mail;

/// Contains all SQL data types and exposes interfaces to work with them
///
/// Structs are represented as Postgres tables, enums as Postgres enums
pub mod models;

/// Enum to differentiate between client errors (4xx) and server errors (5xx)
///
/// ClientErrors don't have values attached while ServerErrors do because ServerErrors can probably
/// be passed on to the user verbatim, while ClientErrors are context-dependent and should be
/// matched for and handled on the API level.
///
/// Obviously a function should only have one way to cause a ClientError. If this turns out not to
/// be the case for a good reason often enough, a redesign is in order.
#[derive(PartialEq, Debug)]
pub enum ApiError {
    /// Should be used when one operation can unambiguously only fail due to client error in one way
    ///
    /// For example, the only client error that would cause a login to fail is inputting incorrect
    /// credentials.
    ///
    /// The ClientError for any operation should be manually documented. This stipulation only
    /// exists because whatever function returns a ClientError typically can do so in many
    /// contexts, which is why automatically generating an error String is unhelpful.
    ClientError,
    /// Should be used when a serverside error occurs. The String stored should include the actual
    /// error message by way of `format!`
    ///
    /// Since this will be displayed verbatim to the user, punctuation and capitalization should be
    /// used.
    ServerError(String),
}
