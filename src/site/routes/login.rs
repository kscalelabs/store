use crate::components::html;
use crate::utils::parse_cookie;
use axum::http::header;
use axum::response::{Html, IntoResponse, Redirect, Response};
use axum::Extension;
use axum::Form;
use backend::config::Config;
use backend::models::traits::SqlTable;
use backend::models::user::AuthCookie;
use backend::ApiError;
use bb8::Pool;
use bb8_postgres::PostgresConnectionManager;
use serde::Deserialize;
use tokio_postgres::NoTls;
use tower_cookies::Cookies;

fn login_html(error: Option<&str>) -> String {
    html(
        "Login - K-Scale Store",
        None,
        &format!(
            r#"
        <h1>Login</h1>
        <form action="/login" method="POST">
            <div>
                <label for="email">Email address</label>
                <input name="email" required type="text">
            </div>
            <div>
                <label for="password">Password</label>
                <input name="password" required type="password">
            </div>
            {}
            <button type="submit">Login</button>
        </form>
            "#,
            match error {
                Some(s) => format!(r#"<div class="error">{}</div>"#, s),
                None => String::new(),
            }
        ),
    )
}

pub async fn get(
    cookies: Cookies,
    Extension(pool): Extension<Pool<PostgresConnectionManager<NoTls>>>,
) -> Response {
    match parse_cookie(cookies, "Login", &pool).await {
        Ok(res) => match res {
            Some(_user) => Redirect::to("/settings").into_response(),
            None => Html(login_html(None)).into_response(),
        },
        Err(e) => e,
    }
}

/// This struct is only public because it's taken as a form by the POST route.
///
/// You are not intended to use this in another route and can safely ignore its existence for
/// everything besides said POST route.
#[derive(Deserialize)]
pub struct Login {
    email: String,
    password: String,
}

pub async fn post(
    Form(Login { email, password }): Form<Login>,
    Extension(pool): Extension<Pool<PostgresConnectionManager<NoTls>>>,
    Extension(config): Extension<Config>,
) -> Response {
    match AuthCookie::create(&email, &password, &pool).await {
        Ok(cookie) => match cookie.insert(&pool).await {
            Ok(()) => match cookie.to_string(&config.domain) {
                Some(s) => (
                    [(header::SET_COOKIE, s)],
                    Redirect::to("/")
                ).into_response(),
                None => Html(login_html(Some("Serverside error encountered when trying to login: The cookie's lifetime is not being set correctly."))).into_response(),
            },
            Err(e) => Html(login_html(Some(&format!("Serverside error encountered when trying to login: {}", e)))).into_response(),
        },
        Err(e) => match e {
            ApiError::ClientError => Html(login_html(Some("Incorrect credentials."))).into_response(),
            ApiError::ServerError(server_err) => Html(login_html(Some(&format!("Serverside error encountered when trying to login: {}", server_err)))).into_response(),
        }
    }
}
