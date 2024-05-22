use crate::components::html;
use crate::utils::parse_cookie;
use axum::extract::Query;
use axum::response::{Html, IntoResponse, Redirect, Response};
use axum::Extension;
use axum::Form;
use backend::config::Config;
use backend::mail::message;
use backend::models::traits::SqlTable;
use backend::models::user::{AuthCookie, ChangeEmailCode, User};
use backend::ApiError;
use bb8::Pool;
use bb8_postgres::PostgresConnectionManager;
use lettre::{AsyncSmtpTransport, AsyncTransport, Tokio1Executor};
use serde::Deserialize;
use tokio_postgres::NoTls;
use tower_cookies::Cookies;

enum FormError {
    ChangeEmail(String),
    ChangePassword(String),
    None,
}

fn settings_html(email: &str, error: FormError) -> String {
    html(
        "Settings - K-Scale Store",
        Some(String::from(email)),
        &format!(
            r#"
                <h1>Settings</h1>
                <h2>Change Email</h2>
                <p>A verification link will be sent to your new email.</p>
                <form action="/settings/change-email" method="POST">
                    <div>
                        <label for="email">New email address</label>
                        <input name="email" required type="text">
                    </div>
                    {}
                    <button type="submit">Send</button>
                </form>
                <h2>Change Password</h2>
                <p>All passwords must have a rating of 4 when measured against <a href="https://lowe.github.io/tryzxcvbn/">zxcvbn</a>. To make a strong password, either <a href="https://xkcd.com/936/?correct=horse&battery=staple">use a string of unrelated words</a> or better yet, use a <a href="https://www.passwordstore.org/">password manager</a>.</p>
                <p>Changing your password will sign you out of all sessions, including this one.</p>
                <form action="/settings/change-password" method="POST">
                    <div>
                        <label for="old_password">Old password</label>
                        <input name="old_password" required type="password">
                    </div>
                    <div>
                        <label for="new_password">Password</label>
                        <input name="new_password" required type="password">
                    </div>
                    {}
                    <button type="submit">Change</button>
                </form>
            "#,
            if let FormError::ChangeEmail(s) = &error {
                format!(r#"<div class="error">{}</div>"#, s)
            } else {
                String::new()
            },
            if let FormError::ChangePassword(s) = &error {
                format!(r#"<div class="error">{}</div>"#, s)
            } else {
                String::new()
            },
        ),
    )
}

pub async fn get(
    cookies: Cookies,
    Extension(pool): Extension<Pool<PostgresConnectionManager<NoTls>>>,
) -> Response {
    match parse_cookie(cookies, "Settings", &pool).await {
        Ok(res) => match res {
            Some(user) => Html(settings_html(&user.email, FormError::None)).into_response(),
            None => Redirect::to("/login").into_response(),
        },
        Err(e) => e,
    }
}

#[derive(Deserialize)]
pub struct Code {
    code: String,
}

pub async fn get_change_email(
    cookies: Cookies,
    Query(Code { code }): Query<Code>,
    Extension(pool): Extension<Pool<PostgresConnectionManager<NoTls>>>,
) -> impl IntoResponse {
    let email: Option<String> = match parse_cookie(cookies, "Change Email", &pool).await {
        Ok(res) => match res {
            Some(user) => Some(user.email),
            None => None,
        },
        Err(_) => None,
    };
    match ChangeEmailCode::get(&code, &pool).await {
        Ok(c) => match User::change_email(&c.old_email, &c.new_email, &pool).await {
            Ok(()) => {
                let _ = ChangeEmailCode::delete_from_old_email(&c.old_email, &pool).await;
                let _ = ChangeEmailCode::delete_from_new_email(&c.new_email, &pool).await;
                Html(html("Change Email - K-Scale Store", email, "<h1>Change Email</h1><p>Successfully changed email.</p>"))
            },
            Err(e) => Html(html("Change Email - K-Scale Store", email, &format!("<h1>Change Email</h1><p>Serverside error encountered when trying to change email: {}", e)))
        },
        Err(e) => match e {
            ApiError::ClientError => Html(html("Change Email - K-Scale Store", email, "<h1>Change Email</h1><p>Your change email code is invalid.</p><p>Perhaps it expired or never existed in the first place.</p><p>Send your new address another email.</p>")),
            ApiError::ServerError(server_err) => Html(html("Change Email - K-Scale Store", email, &format!("<h1>Change Email</h1><p>Serverside error encountered when trying to change email: {}", server_err))),
        }
    }
}

#[derive(Deserialize)]
pub struct ChangeEmail {
    email: String,
}

pub async fn post_change_email(
    cookies: Cookies,
    Extension(config): Extension<Config>,
    Extension(pool): Extension<Pool<PostgresConnectionManager<NoTls>>>,
    Extension(mailer): Extension<AsyncSmtpTransport<Tokio1Executor>>,
    Form(ChangeEmail { email }): Form<ChangeEmail>,
) -> Response {
    match parse_cookie(cookies, "Settings", &pool).await {
        Ok(res) => match res {
            Some(user) => match User::get(&email, &pool).await {
                Ok(_) => Html(settings_html(&user.email, FormError::ChangeEmail(String::from("A user with this email already exists.")))).into_response(),
                Err(e) => match e {
                    ApiError::ClientError => {
                        // It doesn't really matter if we fail to delete all the old verification
                        // codes, this is partially security theater meant to make UX conform to
                        // other websites.
                        //
                        // We just await since this is super fast anyways (unlike the mailer grr).
                        let _ = ChangeEmailCode::delete_from_old_email(&user.email, &pool).await;
                        let code = ChangeEmailCode::new(&user.email, &email);
                        if code.insert(&pool).await.is_ok() {
                            let message = message(
                                &config.mail.name,
                                &config.mail.email,
                                &email,
                                "Email change requested for K-Scale Store",
                                &code.to_email_text(&config.domain),
                            );
                            if let Ok(m) = message {
                                tokio::spawn(async move {
                                    let _ = mailer.send(m).await;
                                });
                            }
                        }
                        Redirect::to("/settings").into_response()
                    },
                    ApiError::ServerError(server_err) => Html(settings_html(
                        &user.email,
                        FormError::ChangeEmail(format!(
                            "Serverside error encountered when trying to determine whether a user with this email already exists: {}",
                            server_err
                        )),
                    )).into_response(),
                }
            },
            None => Redirect::to("/login").into_response(),
        },
        Err(e) => e,
    }
}

#[derive(Deserialize)]
pub struct ChangePassword {
    old_password: String,
    new_password: String,
}

pub async fn change_password(
    cookies: Cookies,
    Extension(pool): Extension<Pool<PostgresConnectionManager<NoTls>>>,
    Form(ChangePassword {
        old_password,
        new_password,
    }): Form<ChangePassword>,
) -> Response {
    match parse_cookie(cookies, "Settings", &pool).await {
        Ok(res) => match res {
            Some(user) => match User::auth(&user.email, &old_password, &pool).await {
                true => {
                    match User::check_password(&new_password) {
                        Ok(b) => if !b {
                            return Html(settings_html(&user.email, FormError::ChangePassword(String::from("New password is not strong enough.")))).into_response();
                        },
                        Err(e) => return Html(settings_html(&user.email, FormError::ChangePassword(format!("Serverside error encountered when zxcvbn tried to check new password: {}", e)))).into_response(),
                    }
                    match User::set_password(&user.email, &new_password, &pool).await {
                        Ok(res) => match res {
                            Some(e) => Html(settings_html(&user.email, FormError::ChangePassword(format!("Serverside error encountered when trying to hash new password: {}", e)))).into_response(),
                            None => {
                                let _ = AuthCookie::delete_from_email(&user.email, &pool).await;
                                Redirect::to("/settings").into_response()
                            },
                        },
                        Err(e) => Html(settings_html(&user.email, FormError::ChangePassword(format!("Failed to get connection from connection pool: {}", e)))).into_response(),
                    }
                }
                false => Html(settings_html(
                    &user.email,
                    FormError::ChangePassword(String::from("Wrong password submitted.")),
                ))
                .into_response(),
            },
            None => Redirect::to("/login").into_response(),
        },
        Err(e) => e,
    }
}
