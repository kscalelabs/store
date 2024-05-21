use crate::routes::html;
use crate::utils::parse_cookie;
use axum::http::StatusCode;
use axum::response::{Html, IntoResponse, Response};
use axum::Extension;
use backend::models::listing::Listing;
use backend::models::traits::SqlTable;
use backend::models::user::User;
use bb8::Pool;
use bb8_postgres::PostgresConnectionManager;
use tokio_postgres::NoTls;
use tower_cookies::Cookies;

async fn listing_html(
    listings: Vec<Listing>,
    email: Option<String>,
    pool: &Pool<PostgresConnectionManager<NoTls>>,
) -> String {
    let mut res: String = String::from("<h1>Listings</h1>");
    if email.is_some() {
        res += r#"<p><a href="/new">+ Post a listing</a></p>"#
    };
    for listing in listings {
        res += &format!(
            r#"<div class="listing">
                <div>
                    <span class="listing-title"><a href="listings/?id={}">{}</a></span>
                    |
                    <span class="listing-price">${}</span>
                </div>
                <div class="listing-contact">{}</div>
            </div>"#,
            listing.id,
            listing.title,
            listing.price,
            if let Ok(user) = User::from_uuid(listing.user_id, pool).await {
                user.email
            } else {
                String::from("Error: Could not retrieve listing email.")
            }
        )
    }
    html("Listings", email, &res)
}

pub async fn get(
    cookies: Cookies,
    Extension(pool): Extension<Pool<PostgresConnectionManager<NoTls>>>,
) -> Response {
    match Listing::get_all(&pool).await {
        Some(listings) => match parse_cookie(cookies, "Listings", &pool).await {
            Ok(res) => match res {
                Some(user) => {
                    Html(listing_html(listings, Some(user.email), &pool).await).into_response()
                }
                None => Html(listing_html(listings, None, &pool).await).into_response(),
            },
            Err(e) => e,
        },
        None => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}
