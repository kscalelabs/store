use axum::response::{IntoResponse, Redirect};
use axum::Extension;
use backend::config::Config;
use backend::models::user::AuthCookie;

pub async fn get(Extension(config): Extension<Config>) -> impl IntoResponse {
    (
        [AuthCookie::unset_header(&config.domain)],
        Redirect::to("/"),
    )
}
