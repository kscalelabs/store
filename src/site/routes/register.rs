use crate::components::html;
use crate::utils::parse_cookie;
use axum::extract::Query;
use axum::http::header;
use axum::response::{Html, IntoResponse, Redirect, Response};
use axum::Extension;
use axum::Form;
use backend::config::Config;
use backend::mail::message;
use backend::models::traits::SqlTable;
use backend::models::user::{AuthCookie, InviteCode, User};
use backend::ApiError;
use bb8::Pool;
use bb8_postgres::PostgresConnectionManager;
use lettre::{AsyncSmtpTransport, AsyncTransport, Tokio1Executor};
use serde::Deserialize;
use tokio_postgres::NoTls;
use tower_cookies::Cookies;

#[derive(Deserialize)]
pub struct Code {
    code: Option<String>,
}

async fn register_html(
    code: &str,
    error: Option<&str>,
    pool: &Pool<PostgresConnectionManager<NoTls>>,
) -> String {
    match InviteCode::get(code, pool).await {
        Ok(invite_code) => html(
            "Register - K-Scale Store",
            None,
            &format!(
                r#"<h1>Register</h1>
                <p>All passwords must have a rating of 4 when measured against <a href="https://lowe.github.io/tryzxcvbn/">zxcvbn</a>. To make a strong password, either <a href="https://xkcd.com/936/?correct=horse&battery=staple">use a string of unrelated words</a> or better yet, use a <a href="https://www.passwordstore.org/">password manager</a>.</p>
                <form action="/register" method="POST">
                    <div>
                        <input name="code" type="hidden" value="{}">
                        <label for="email">Email address (you can't edit this)</label>
                    </div>
                    <div>
                        <input name="email" readonly type="text" value="{}">
                        <label for="password">Password</label>
                        <input name="password" required type="password">
                    </div>
                    {}
                    <button type="submit">Register</button>
                </form>"#,
                code,
                invite_code.email,
                match error {
                    Some(s) => format!(r#"<div class="error">{}</div>"#, s),
                    None => String::new(),
                }
            ),
        ),
        Err(e) => match e {
            ApiError::ClientError => html("Register - K-Scale Store", None, "<h1>Register</h1>
                                         <p>Your registration code is invalid.</p>
                                         <p>Perhaps it expired or never existed in the first place.</p>
                                         <p>Try sending yourself a registration code again.</p>
                                     "),
            ApiError::ServerError(e) => html("Register - K-Scale Store", None, &format!("<h1>Register</h1>
                                            <p>The K-Scale Store has encountered a server-side error in determining whether your invite code is valid:</p>
                                            <p>{}</p>
                                            <p>If this persists, please contact the K-Scale team.</p>", e
                                        )),
        }
    }
}

fn reg_req_html(error: Option<&str>) -> String {
    html(
        "Register - K-Scale Store",
        None,
        &format!(
            r#"
            <h1>Register</h1>
            <p>To create an account, enter your email address. You will then be sent an email containing a registration link. (This helps to avoid part of the song and dance with email verification.)</p>
            <form action="/register/generate-code" method="POST">
                <div>
                    <label for="email">Email address</label>
                    <input name="email" required type="text">
                </div>
                {}
                <button type="submit">Send Code</button>
            </form>
            "#,
            if let Some(s) = &error {
                format!(r#"<div class="error">{}</div>"#, s)
            } else {
                String::new()
            }
        ),
    )
}

pub async fn get(
    cookies: Cookies,
    Query(Code { code }): Query<Code>,
    Extension(pool): Extension<Pool<PostgresConnectionManager<NoTls>>>,
) -> Response {
    match parse_cookie(cookies, "Register", &pool).await {
        Ok(res) => match res {
            Some(_user) => Redirect::to("/settings").into_response(),
            None => match &code {
                Some(code) => Html(register_html(code, None, &pool).await).into_response(),
                None => Html(reg_req_html(None)).into_response(),
            },
        },
        Err(e) => e,
    }
}

#[derive(Deserialize)]
pub struct RegistrationRequest {
    email: String,
}

pub async fn post_req(
    Form(RegistrationRequest { email }): Form<RegistrationRequest>,
    Extension(pool): Extension<Pool<PostgresConnectionManager<NoTls>>>,
    Extension(config): Extension<Config>,
    Extension(mailer): Extension<AsyncSmtpTransport<Tokio1Executor>>,
) -> Response {
    match User::get(&email, &pool).await {
        Ok(_) => Html(reg_req_html(Some("A user with this email address already exists.</div>")
                )).into_response(),
        Err(e) => match e {
            ApiError::ClientError => {
                let code = InviteCode::new(&email);
                if code.insert(&pool).await.is_ok() {
                    let message = message(
                        &config.mail.name,
                        &config.mail.email,
                        &email,
                        "K-Scale Store Registration Code",
                        &code.to_email_text(&config.domain),
                    );
                    if let Ok(m) = message {
                        tokio::spawn(async move {
                            let _ = mailer.send(m).await;
                        });
                    }
                }
                Html(html("Register - K-Scale Store", None, "<h1>Register</h1><p>An email with a registration link should arrive shortly.</p>")).into_response()
            }
            ApiError::ServerError(server_err) => Html(reg_req_html(
                Some(&format!("
                        <p>Serverside error encountered when trying to determine whether a user with this email already exists: {}</p>
                        <p>Contact the K-Scale team if this persists.</p>
                    ",
                    server_err
                ),
            ))).into_response(),
        },
    }
}

/// This struct is only public because it's taken as a form by the POST route.
///
/// You are not intended to use this in another route and can safely ignore its existence for
/// everything besides said POST route.
#[derive(Deserialize)]
pub struct Registration {
    code: String,
    password: String,
}

pub async fn post(
    Form(registration): Form<Registration>,
    Extension(pool): Extension<Pool<PostgresConnectionManager<NoTls>>>,
    Extension(config): Extension<Config>,
) -> Response {
    match User::create(&registration.code, &registration.password, &pool).await {
        Ok(user) => match user.insert(&pool).await {
            Ok(()) => {
                // We don't care too much about the result of this deletion. Sure, it'll be weird
                // if users go back to the registration page, find they can register again, and
                // then fail to make an account with the same email address, but there's no better
                // way to handle this.
                let _ = InviteCode::delete_from_email(&user.email, &pool).await;
                let cookie = AuthCookie::create_no_verify(&user.email);
                match cookie.insert(&pool).await {
                    Ok(()) => match &cookie.to_string(&config.domain) {
                        Some(cookie) => (
                            [(header::SET_COOKIE, cookie)],
                            Redirect::to("/settings")
                        ).into_response(),
                        None => Redirect::to("/login").into_response(),
                    },
                    Err(_) => Redirect::to("/login").into_response(),
                }
            },
            Err(e) => Html(register_html(&registration.code, Some(&format!("Serverside error encountered when trying to insert user into the database: {}", e)), &pool).await).into_response(),
        },
        Err(e) => match e {
            ApiError::ClientError => Html(register_html(&registration.code, Some("The password you entered is not strong enough."), &pool).await).into_response(),
            ApiError::ServerError(server_err) => Html(register_html(&registration.code, Some(&format!("Serverside error encountered when trying to create user: {}", server_err)), &pool).await).into_response(),
        },
    }
}
