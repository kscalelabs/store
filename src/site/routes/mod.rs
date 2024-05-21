pub mod index;
pub mod listing;
pub mod login;
pub mod logout;
pub mod register;
pub mod settings;

use crate::components::html;
use crate::utils::parse_cookie;
use axum::Extension;
use axum::{
    http::StatusCode,
    response::{Html, IntoResponse, Response},
};
use bb8::Pool;
use bb8_postgres::PostgresConnectionManager;
use tokio_postgres::NoTls;
use tower_cookies::Cookies;

pub async fn error404(
    cookies: Cookies,
    Extension(pool): Extension<Pool<PostgresConnectionManager<NoTls>>>,
) -> Response {
    match parse_cookie(cookies, "404 Error", &pool).await {
        Ok(res) => (
            StatusCode::NOT_FOUND,
            Html(html(
                "404 - K-Scale Store",
                match res {
                    Some(user) => Some(user.email),
                    None => None,
                },
                "<h1>404 Error</h1>
                <p>This page could not be found.</p>",
            )),
        )
            .into_response(),
        Err(e) => e,
    }
}
