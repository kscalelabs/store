use super::traits::SqlTable;
use crate::ApiError;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use async_trait::async_trait;
use axum::http::header::{self, HeaderName};
use bb8::Pool;
use bb8_postgres::PostgresConnectionManager;
use postgres_types::{FromSql, ToSql};
use rand::{distributions::Alphanumeric, thread_rng, Rng};
use serde::Deserialize;
use std::ops::Add;
use std::time::{Duration, SystemTime};
use tokio_postgres::row::Row;
use tokio_postgres::NoTls;
use uuid::Uuid;
use zxcvbn::zxcvbn;

// We can't really run unit tests for this module because everything relies on having a Postgres
// connection pool. The only functions that don't are the ones that relate to hashing, and one of
// them relies on randomness anyway, so we have to test them together.

/// The table that stores authentication cookies, which are used by the HTML website (and ONLY the
/// website, not the API) to verify requests.
#[derive(Debug, ToSql, FromSql)]
pub struct AuthCookie {
    /// The cookie value.
    ///
    /// Cookies should be random 64-character alphanumeric strings.
    ///
    /// It should be randomly generated.
    value: String,
    /// The email address (and therefore, account) that this cookie authenticates.
    email: String,
    expiry_date: SystemTime,
}

impl TryFrom<Row> for AuthCookie {
    type Error = tokio_postgres::error::Error;
    fn try_from(row: Row) -> Result<Self, Self::Error> {
        Ok(Self {
            value: row.try_get("value")?,
            email: row.try_get("email")?,
            expiry_date: row.try_get("expiry_date")?,
        })
    }
}

#[async_trait]
impl SqlTable for AuthCookie {
    fn table_name() -> String {
        String::from("auth_cookies")
    }
    fn create_query() -> String {
        format!(
            "CREATE TABLE IF NOT EXISTS {} (
                value       VARCHAR (64)    NOT NULL UNIQUE,
                email       VARCHAR (64)    NOT NULL,
                expiry_date TIMESTAMP       NOT NULL
            );",
            Self::table_name(),
        )
    }
    async fn insert(
        &self,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<(), bb8::RunError<tokio_postgres::error::Error>> {
        let connection = pool.get().await?;
        connection
            .execute(
                &format!(
                    "INSERT INTO {} (value, email, expiry_date) VALUES ($1, $2, $3)",
                    Self::table_name()
                ),
                &[&self.value, &self.email, &self.expiry_date],
            )
            .await?;
        Ok(())
    }
}

impl AuthCookie {
    /// Creates a new AuthCookie without verifying credentials.
    ///
    /// Should only be used in special occasions like post-registration.
    pub fn create_no_verify(email: &str) -> Self {
        Self {
            value: rand_64(),
            email: String::from(email),
            // Sign-ins last about a year.
            expiry_date: SystemTime::now().add(Duration::from_secs(60 * 60 * 24 * 365)),
        }
    }
    /// Creates a new AuthCookie.
    ///
    /// Should be used when signing in to the account.
    pub async fn create(
        email: &str,
        password: &str,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<Self, ApiError> {
        if User::auth(email, password, pool).await {
            Ok(Self::create_no_verify(email))
        } else {
            // Incorrect credentials.
            Err(ApiError::ClientError)
        }
    }
    /// Returns a Cookie as a header string so that we can send an HTTP Set-Cookie header.
    ///
    /// The function returns None if the cookie is expired.
    pub fn to_string(&self, domain: &str) -> Option<String> {
        match &self.expiry_date.duration_since(SystemTime::now()) {
            Ok(duration) => Some(format!(
                "session={}; Max-Age={}; Domain={}; Path=/; SameSite=Lax; Secure; HttpOnly",
                self.value,
                duration.as_secs(),
                domain,
            )),
            Err(_) => None,
        }
    }
    /// A SET_COOKIE header with a session cookie string with Max-Age=0. This header functionally
    /// unsets the current session cookie and is useful for logout, etc.
    pub fn unset_header(domain: &str) -> (HeaderName, String) {
        (
            header::SET_COOKIE,
            format!("session=; Max-Age=0; Domain={}", domain),
        )
    }
    /// Check whether session cookie is valid, and if so, return associated user
    ///
    /// Should be used in conjunction with Self::get_one()
    pub async fn get_user(
        &self,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<User, ApiError> {
        if self.expiry_date > SystemTime::now() {
            match User::get_one("email", &self.email, pool).await {
                Ok(user) => Ok(user),
                Err(e) => match e {
                    ApiError::ServerError(e) => Err(ApiError::ServerError(e)),
                    ApiError::ClientError => Err(ApiError::ServerError(String::from(
                        "The user that corresponds to this cookie could not be found.",
                    ))),
                },
            }
        } else {
            // Cookie is expired.
            Err(ApiError::ClientError)
        }
    }
    /// Deletes cookie based on value.
    pub async fn delete_from_value(
        value: &str,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<(), bb8::RunError<tokio_postgres::error::Error>> {
        Self::delete("value", value, pool).await
    }
    /// Deletes all cookies associated with an email address.
    pub async fn delete_from_email(
        email: &str,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<(), bb8::RunError<tokio_postgres::error::Error>> {
        Self::delete("email", email, pool).await
    }
    // This function literally only exists for integration testing.
    // Therefore, we hide it so that not even other developers accidentally use it.
    #[doc(hidden)]
    pub fn value(&self) -> String {
        self.value.clone()
    }
}

/// The table that stores invite codes (which are sent via email to new users)
///
/// These invite codes are how you'd make an account on the store. (Users who would like to
/// register for an account are technically requesting an invite code, which then can be used to
/// create an account. This is convenient for not coding limited functionality for people who
/// haven't verified their emails, since you won't be able to sell until you have provided the
/// minimum amount of verification that you are who you say you are.)
#[derive(Debug, Deserialize, ToSql, FromSql)]
pub struct InviteCode {
    /// This is the invite code.
    ///
    /// Invite codes are 64-character long alphanumeric strings. The alphanumeric part is so we
    /// don't need to do URL encoding.
    ///
    /// It should be randomly generated.
    code: String,
    /// Email to send invite code to.
    ///
    /// This is also the email that the invitee will sign up with.
    pub email: String,
    expiry_date: SystemTime,
}

impl TryFrom<Row> for InviteCode {
    type Error = tokio_postgres::error::Error;
    fn try_from(row: Row) -> Result<Self, Self::Error> {
        Ok(Self {
            code: row.try_get("code")?,
            email: row.try_get("email")?,
            expiry_date: row.try_get("expiry_date")?,
        })
    }
}

#[async_trait]
impl SqlTable for InviteCode {
    fn table_name() -> String {
        String::from("invite_codes")
    }
    fn create_query() -> String {
        format!(
            "CREATE TABLE IF NOT EXISTS {} (
                code        TEXT            NOT NULL UNIQUE,
                email       VARCHAR (64)    NOT NULL,
                expiry_date TIMESTAMP       NOT NULL
            );",
            Self::table_name(),
        )
    }
    async fn insert(
        &self,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<(), bb8::RunError<tokio_postgres::error::Error>> {
        let connection = pool.get().await?;
        connection
            .execute(
                &format!(
                    "INSERT INTO {} (code, email, expiry_date) VALUES ($1, $2, $3)",
                    Self::table_name()
                ),
                &[&self.code, &self.email, &self.expiry_date],
            )
            .await?;
        Ok(())
    }
}

/// Struct that is returned from InviteCode::get
pub struct InviteCodeInfo {
    /// Determines the email address of the account created using this InviteCode.
    ///
    /// This will be the same email address the invitation is sent to.
    pub email: String,
}

impl InviteCode {
    /// Generates a new InviteCode object
    pub fn new(email: &str) -> Self {
        Self {
            code: rand_64(),
            email: String::from(email),
            expiry_date: SystemTime::now().add(Duration::from_secs(7 * 24 * 60 * 60)),
        }
    }

    /// Pass in an invite code to check whether it is a valid (i.e. not expired) invite code, and
    /// if so, returns email address
    pub async fn get(
        code: &str,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<InviteCodeInfo, ApiError> {
        match Self::get_one("code", code, pool).await {
            Ok(c) => {
                if c.expiry_date > SystemTime::now() {
                    Ok(InviteCodeInfo { email: c.email })
                } else {
                    // This is OK because even though Self::get_one() can return a client error, it
                    // only does so when no such InviteCode exists. Whether the InviteCode exists or
                    // not, so long as it is invalid, that is all the client needs to know.
                    Err(ApiError::ClientError)
                }
            }
            Err(e) => Err(e),
        }
    }
    /// Generates text of invitation email
    pub fn to_email_text(&self, domain: &str) -> String {
        format!(
            "You (or someone else) has attempted to register for an account at {}. To finish the process, go to\n\nhttps://{}/register?code={}\n\nThis code expires in a week.",
            domain,
            domain,
            self.code,
        )
    }

    /// Deletes all InviteCodes in the database with a certain email.
    ///
    /// Meant to be run after creating and successfully inserting a new user.
    pub async fn delete_from_email(
        email: &str,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<(), bb8::RunError<tokio_postgres::error::Error>> {
        Self::delete("email", email, pool).await
    }

    // This function literally only exists for integration testing.
    // Therefore, we hide it so that not even other developers accidentally use it.
    #[doc(hidden)]
    pub fn code(&self) -> String {
        self.code.clone()
    }
}

/// The table that stores change email codes.
#[derive(Debug, PartialEq, ToSql, FromSql)]
pub struct ChangeEmailCode {
    /// This is the change email code.
    ///
    /// Change email codes are 64-character long alphanumeric strings. The alphanumeric part is so
    /// we don't need to do URL encoding.
    ///
    /// It should be randomly generated.
    code: String,
    /// Old email so we know what account to update.
    pub old_email: String,
    /// New email to send change email code to.
    pub new_email: String,
    expiry_date: SystemTime,
}

impl TryFrom<Row> for ChangeEmailCode {
    type Error = tokio_postgres::error::Error;
    fn try_from(row: Row) -> Result<Self, Self::Error> {
        Ok(Self {
            code: row.try_get("row")?,
            old_email: row.try_get("old_email")?,
            new_email: row.try_get("new_email")?,
            expiry_date: row.try_get("expiry_date")?,
        })
    }
}

#[async_trait]
impl SqlTable for ChangeEmailCode {
    fn table_name() -> String {
        String::from("change_email_codes")
    }
    fn create_query() -> String {
        format!(
            "CREATE TABLE IF NOT EXISTS {} (
                code        TEXT            NOT NULL UNIQUE,
                old_email   VARCHAR (64)    NOT NULL,
                new_email   VARCHAR (64)    NOT NULL,
                expiry_date TIMESTAMP       NOT NULL
            );",
            Self::table_name(),
        )
    }
    async fn insert(
        &self,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<(), bb8::RunError<tokio_postgres::error::Error>> {
        let connection = pool.get().await?;
        connection
            .execute(
                &format!(
                    "INSERT INTO {} (code, old_email, new_email, expiry_date) VALUES ($1, $2, $3, $4)",
                    Self::table_name()
                ),
                &[&self.code, &self.old_email, &self.new_email, &self.expiry_date],
            )
            .await?;
        Ok(())
    }
}

/// Struct that is returned from ChangeEmailCode::get
pub struct ChangeEmailCodeInfo {
    /// Original email of the account to be updated.
    pub old_email: String,
    /// New email of the account to be updated.
    pub new_email: String,
}

impl ChangeEmailCode {
    /// Generates a new ChangeEmailCode object
    pub fn new(old_email: &str, new_email: &str) -> Self {
        Self {
            code: rand_64(),
            old_email: String::from(old_email),
            new_email: String::from(new_email),
            expiry_date: SystemTime::now().add(Duration::from_secs(7 * 24 * 60 * 60)),
        }
    }

    /// Pass in a change email code to check whether it is valid (i.e. not expired), and if so,
    /// returns old and new email address
    pub async fn get(
        code: &str,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<ChangeEmailCodeInfo, ApiError> {
        match Self::get_one("code", code, pool).await {
            Ok(c) => {
                if c.expiry_date > SystemTime::now() {
                    Ok(ChangeEmailCodeInfo {
                        old_email: c.old_email,
                        new_email: c.new_email,
                    })
                } else {
                    // This is OK because even though Self::get_one() can return a client error, it
                    // only does so when no such InviteCode exists. Whether the InviteCode exists or
                    // not, so long as it is invalid, that is all the client needs to know.
                    Err(ApiError::ClientError)
                }
            }
            Err(e) => Err(e),
        }
    }

    /// Generates email text to be sent to new email
    pub fn to_email_text(&self, domain: &str) -> String {
        format!(
            "You've requested to change your email on the K-Scale Store from {}\nto the email address you are receiving this email in. To do so, go to\n\nhttps://{}/settings/change_email?code={}\n\nThis invitation code expires in a week.",
            self.old_email,
            domain,
            self.code,
        )
    }

    /// Deletes all EmailChangeCodes in the database with a certain old email.
    ///
    /// Meant to be run after successfully changing a user's email and before each change email
    /// request (so that only one change email code is valid for a user at a time).
    pub async fn delete_from_old_email(
        old_email: &str,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<(), bb8::RunError<tokio_postgres::error::Error>> {
        Self::delete("old_email", old_email, pool).await
    }

    /// Deletes all EmailChangeCodes in the database with a certain new email.
    ///
    /// Meant to be run after successfully changing a user's email.
    pub async fn delete_from_new_email(
        new_email: &str,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<(), bb8::RunError<tokio_postgres::error::Error>> {
        Self::delete("new_email", new_email, pool).await
    }

    // This function literally only exists for integration testing.
    // Therefore, we hide it so that not even other developers accidentally use it.
    #[doc(hidden)]
    pub fn code(&self) -> String {
        self.code.clone()
    }
}

/// The table that stores user authentication data.
#[derive(Debug, PartialEq, ToSql, FromSql)]
pub struct User {
    uuid: Uuid,
    pub email: String,
    password_hash: String,
}

impl TryFrom<Row> for User {
    type Error = tokio_postgres::error::Error;
    fn try_from(row: Row) -> Result<Self, Self::Error> {
        Ok(Self {
            uuid: row.try_get("uuid")?,
            email: row.try_get("email")?,
            password_hash: row.try_get("password_hash")?,
        })
    }
}

#[async_trait]
impl SqlTable for User {
    fn table_name() -> String {
        String::from("users")
    }
    fn create_query() -> String {
        format!(
            "CREATE TABLE IF NOT EXISTS {} (
                uuid            UUID            NOT NULL UNIQUE,
                email           VARCHAR (64)    NOT NULL UNIQUE,
                password_hash   TEXT            NOT NULL
            );",
            Self::table_name(),
        )
    }
    async fn insert(
        &self,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<(), bb8::RunError<tokio_postgres::error::Error>> {
        let connection = pool.get().await?;
        connection
            .execute(
                &format!(
                    "INSERT INTO {} (uuid, email, password_hash) VALUES ($1, $2, $3)",
                    Self::table_name()
                ),
                &[&self.uuid, &self.email, &self.password_hash],
            )
            .await?;
        Ok(())
    }
}

impl User {
    /// Checks if a password is strong enough to be used.
    ///
    /// This uses Dropbox's zxcvbn library with a strength setting of 4.
    pub fn check_password(password_hash: &str) -> Result<bool, zxcvbn::ZxcvbnError> {
        Ok(zxcvbn(password_hash, &[])?.score() == 4)
    }
    /// Hashes a plaintext password_hash.
    pub fn hash_password(
        password_hash: &str,
    ) -> Result<String, argon2::password_hash::errors::Error> {
        let argon2 = Argon2::default();
        let salt = SaltString::generate(&mut OsRng);
        Ok(argon2
            .hash_password(password_hash.as_bytes(), &salt)?
            .to_string())
    }
    /// Checks whether a plaintext password is equivalent to a hashed password.
    fn check_hashed_password(password: &str, hash: &PasswordHash) -> bool {
        match Argon2::default().verify_password(password.as_bytes(), hash) {
            Ok(()) => true,
            Err(_) => false,
        }
    }
    /// Gets user from email
    pub async fn get(
        email: &str,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<Self, ApiError> {
        Self::get_one("email", email, pool).await
    }
    /// Gets user from uuid
    pub async fn from_uuid(
        uuid: Uuid,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<Self, ApiError> {
        Self::get_one("uuid", uuid, pool).await
    }
    /// Check whether an email-password pair is valid
    pub async fn auth(
        email: &str,
        password: &str,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> bool {
        if let Ok(user) = Self::get(email, pool).await {
            return Self::check_hashed_password(
                password,
                &match PasswordHash::new(&user.password_hash) {
                    Ok(hash) => hash,
                    Err(_) => return false,
                },
            );
        }
        false
    }
    /// Creates a user using the invite code passed
    pub async fn create(
        code: &str,
        password: &str,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<Self, ApiError> {
        match Self::check_password(password) {
            Ok(strong) => if !strong {
                // Even though this client error means "Password is not strong enough", which
                // contrasts with our other client errors which mean "InviteCode invalid", it's OK
                // because if a signup attempt on the webpage fails, it's probably because of a
                // password error, seeing as the InviteCode must have been valid if the user was
                // allowed to see the registration webpage in the first place.
                return Err(ApiError::ClientError);
            },
            Err(e) => return match e {
                    // An empty password is clearly not strong enough, so we can return a
                    // ClientError since it is semantically the same.
                    zxcvbn::ZxcvbnError::BlankPassword => Err(ApiError::ClientError),
                    zxcvbn::ZxcvbnError::DurationOutOfRange => Err(ApiError::ServerError(String::from("Zxcvbn encountered an error converting Duration to/from the standard library implementation."))),
                }
        }
        match InviteCode::get(code, pool).await {
            Ok(InviteCodeInfo { email }) => Ok(Self {
                uuid: Uuid::new_v4(),
                email,
                password_hash: match Self::hash_password(password) {
                    Ok(h) => h,
                    Err(e) => {
                        return Err(ApiError::ServerError(format!(
                            "Failed to hash password: {}",
                            e
                        )))
                    }
                },
            }),
            Err(e) => Err(e),
        }
    }
    /// Queries the database for the cookie and then the associated user.
    pub async fn from_cookie_str(
        cookie: &str,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<Self, ApiError> {
        AuthCookie::get_one("value", cookie, pool)
            .await?
            .get_user(pool)
            .await
    }
    /// Deletes user with given email address.
    pub async fn delete_from_email(
        email: &str,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<(), bb8::RunError<tokio_postgres::error::Error>> {
        Self::delete("email", email, pool).await
    }
    /// Changes the email address of a user.
    ///
    /// This function does not check whether the new email address is available. The developer
    /// should do that in API routes first so they can return more helpful errors.
    pub async fn change_email(
        old_email: &str,
        new_email: &str,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<(), bb8::RunError<tokio_postgres::error::Error>> {
        let connection = pool.get().await?;
        connection
            .execute(
                &format!(
                    "UPDATE {} SET email = $1 WHERE email = $2",
                    Self::table_name()
                ),
                &[&new_email, &old_email],
            )
            .await?;
        Ok(())
    }
    /// Sets the password of the user with given email address.
    ///
    /// The reason for the janky return is because `argon2::password_hash::errors::Error` doesn't
    /// actually implement std::error::Error, so we can't just return
    /// `Box<dyn std::error::Error + Sync + Send>` for our error.
    pub async fn set_password(
        email: &str,
        password: &str,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<
        Option<argon2::password_hash::errors::Error>,
        bb8::RunError<tokio_postgres::error::Error>,
    > {
        let connection = pool.get().await?;
        connection
            .execute(
                &format!(
                    "UPDATE {} SET password_hash = $1 WHERE email = $2",
                    Self::table_name()
                ),
                &[
                    &match Self::hash_password(password) {
                        Ok(hashed_password) => hashed_password,
                        Err(e) => return Ok(Some(e)),
                    },
                    &email,
                ],
            )
            .await?;
        Ok(None)
    }
}

/// Generates a random 64-character long string.
///
/// Used to generate cookies and invite codes
fn rand_64() -> String {
    thread_rng()
        .sample_iter(&Alphanumeric)
        .take(64)
        .map(char::from)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::User;
    use argon2::password_hash::PasswordHash;

    #[test]
    fn test_password_hash() {
        let password = "password";
        let password_hash = User::hash_password(password).unwrap();
        assert!(User::check_hashed_password(
            password,
            &PasswordHash::new(&password_hash).unwrap()
        ));
    }
}
