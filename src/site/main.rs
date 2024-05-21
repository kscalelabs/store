pub mod components;
pub mod routes;
pub mod utils;

use axum::{
    handler::Handler,
    routing::{get, post},
    Extension, Router,
};
use backend::config::Config;
use bb8::Pool;
use bb8_postgres::PostgresConnectionManager;
use lettre::{transport::smtp::authentication::Credentials, AsyncSmtpTransport, Tokio1Executor};
use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use tokio_postgres::NoTls;
use tower_cookies::CookieManagerLayer;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
    // Get config
    let config = Config::get();
    // We have to assign this primitive to a separate variable `port` because `config` is moved
    // later, in .layer(Extension(config))
    let port = config.ports.site;

    // Set up Postgres connection pool
    let mut pg_config = tokio_postgres::config::Config::new();
    pg_config
        .host("localhost")
        .dbname(&config.postgres.dbname)
        .user(&config.postgres.user)
        .password(&config.postgres.password);

    let manager = PostgresConnectionManager::new(pg_config, NoTls);
    let pool = Pool::builder().build(manager).await?;

    // Set up mailer
    let credentials = Credentials::new(config.mail.email.clone(), config.mail.password.clone());

    let mailer: AsyncSmtpTransport<Tokio1Executor> =
        AsyncSmtpTransport::<Tokio1Executor>::relay(&config.mail.relay)?
            .credentials(credentials)
            .build();

    // Application configuration
    let app = Router::new()
        .route("/", get(routes::index::get))
        .route("/register", get(routes::register::get))
        .route("/register", post(routes::register::post))
        .route("/register/generate-code", post(routes::register::post_req))
        .route("/login", get(routes::login::get))
        .route("/login", post(routes::login::post))
        .route("/logout", get(routes::logout::get))
        .route("/settings", get(routes::settings::get))
        .route(
            "/settings/change-email",
            get(routes::settings::get_change_email),
        )
        .route(
            "/settings/change-email",
            post(routes::settings::post_change_email),
        )
        .route(
            "/settings/change-password",
            post(routes::settings::change_password),
        )
        .route("/new", get(routes::listing::get_new))
        .route("/new", post(routes::listing::post_new))
        .fallback(routes::error404.into_service())
        .layer(Extension(pool))
        .layer(Extension(config))
        .layer(Extension(mailer))
        .layer(CookieManagerLayer::new());

    // Run app
    let addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)), port);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;

    Ok(())
}
