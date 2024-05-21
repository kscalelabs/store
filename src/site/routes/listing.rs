use crate::routes::html;
use crate::utils::parse_cookie;
use axum::response::{Html, IntoResponse, Response, Redirect};
use axum::{Extension, Form};
use backend::models::listing::Listing;
use backend::models::traits::SqlTable;
use bb8::Pool;
use bb8_postgres::PostgresConnectionManager;
use serde::Deserialize;
use tokio_postgres::NoTls;
use tower_cookies::Cookies;

pub async fn get_new(
    cookies: Cookies,
    Extension(pool): Extension<Pool<PostgresConnectionManager<NoTls>>>,
) -> Response {
    match parse_cookie(cookies, "New Listing", &pool).await {
        Ok(res) => match res {
            Some(user) => Html(html("New Listing", Some(user.email),
                            r#"
                              <h1>New Listing</h1>
                              <p>If an external purchase link is not provided, the buyer will directly contact you through email to arrange the purchase.</p>
                              <form action="/new" method="POST">
                                <div>
                                    <label for="title">Title (descriptive)*</label>
                                    <input name="title" required type="text">
                                </div>
                                <div>
                                    <label for="price">Price (in dollars)*</label>
                                    <input name="price" required type="number">
                                </div>
                                <div>
                                    <label for="description">Description<label>
                                    <input name="description" type="text">
                                </div>
                                <div>
                                    <label for="url">External Purchase Link<label>
                                    <input name="url" type="text">
                                </div>
                                <button type="submit">Create</submit>
                              </form>
                            "#)).into_response(),
            None => Redirect::to("/").into_response(),
        },
        Err(e) => e,
    }
}

#[derive(Deserialize)]
pub struct ListingRequest {
    title: String,
    price: i32,
    description: Option<String>,
    url: Option<String>,
}

pub async fn post_new(
    cookies: Cookies,
    Form(ListingRequest {title, price, description, url} ): Form<ListingRequest>,
        Extension(pool): Extension<Pool<PostgresConnectionManager<NoTls>>>,
) -> Response {
    match parse_cookie(cookies, "New Listing", &pool).await {
        Ok(res) => match res {
            Some(user) => {
                let listing = Listing::create(
                    user.uuid,
                    title,
                    price,
                    description,
                    url
                );
                match listing.insert(&pool).await {
                    Ok(()) => Redirect::to("/").into_response(),
                    Err(e) => Html(html("New Listing", Some(user.email), &format!("<h1>New Listing</h1><p>Serverside error encountered when trying to post new listing: {}</p><p>Please try again. (If you refresh this page you will make the same request again.)</p>", e))).into_response(),
                }
            }
            None => Redirect::to("/").into_response(),
        },
        Err(e) => e,
    }
}
