pub mod serde;

use crate::components::html;
use axum::{
    http::StatusCode,
    response::{Html, IntoResponse, Response},
};
use backend::models::user::User;
use backend::ApiError;
use bb8::Pool;
use bb8_postgres::PostgresConnectionManager;
use tokio_postgres::NoTls;
use tower_cookies::Cookies;

/// Escape special HTML characters so we don't get XSSed on. The characters that get encoded are
/// - &
/// - <
/// - \>
/// - "
/// - '
pub fn escape_html(html: &str) -> String {
    html.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('\"', "&quot;")
        .replace('\'', "&#39;")
}

/// Either returns the User from the Cookies object or returns a Response explaining what went wrong.
pub async fn parse_cookie(
    cookies: Cookies,
    title: &str,
    pool: &Pool<PostgresConnectionManager<NoTls>>,
) -> Result<Option<User>, Response> {
    match cookies.get("session") {
        Some(cookie) => match User::from_cookie_str(cookie.value(), pool).await {
            Ok(user) => Ok(Some(user)),
            Err(e) => match e {
                // No user associated with the cookie; we may proceed.
                // Deal with this on a case-by-case basis (which is why we return Ok(None))
                ApiError::ClientError => Ok(None),
                // Error in determining whether a user is associated with the cookie; we may not
                // proceed.
                ApiError::ServerError(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, Html(html(
                    &format!("{} - K-Scale Store", title),
                    None,
                    &format!(
                        r#"<h1>{}</h1>
                            <p>The K-Scale Store has encountered a server-side error in determining whether you're logged in:</p>
                            <p class="error">{e}</p>
                            <p>If this persists, please contact your system administrator.</p>"#,
                        e
                    ),
                ))).into_response()),
            },
        },
        // No cookie, so not logged in.
        None => Ok(None),
    }
}
