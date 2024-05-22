use crate::routes::html;
use crate::utils::{escape_html, parse_cookie, serde::empty_to_none};
use axum::extract::Query;
use axum::response::{Html, IntoResponse, Redirect, Response};
use axum::{Extension, Form};
use backend::ApiError;
use backend::models::{user::User, listing::Listing};
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
                                    <textarea name="description" rows="20"></textarea>
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
    #[serde(deserialize_with = "empty_to_none")]
    description: Option<String>,
    #[serde(deserialize_with = "empty_to_none")]
    url: Option<String>,
}

pub async fn post_new(
    cookies: Cookies,
    Extension(pool): Extension<Pool<PostgresConnectionManager<NoTls>>>,
    Form(ListingRequest {
        title,
        price,
        description,
        url,
    }): Form<ListingRequest>,
) -> Response {
    match parse_cookie(cookies, "New Listing", &pool).await {
        Ok(res) => match res {
            Some(user) => {
                let listing = Listing::create(user.uuid, title, price, description, url);
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

#[derive(Deserialize)]
pub struct Id {
    id: String,
}

pub async fn get_listing(
    cookies: Cookies,
    Query(Id { id }): Query<Id>,
    Extension(pool): Extension<Pool<PostgresConnectionManager<NoTls>>>,
) -> Response {
    match parse_cookie(cookies, "Register", &pool).await {
        Ok(res) => {
            match Listing::get_one("id", &id, &pool).await {
                Ok(listing) => {
                        let seller = User::from_uuid(listing.user_id, &pool).await;
                        Html(html(
                            &listing.title,
                            res.as_ref().map(|user| user.email.clone()),
                            &format!(r#"<h1><span class="listing-title">{}{}</span> | <span class="listing-price">${}</span></h1>
                                        {}
                                        <p>Contact: {}</p>
                                        <p>{}</p>
                                        {}
                                     "#,
                                        escape_html(&listing.title),
                                        match (&res, &seller) {
                                            (Some(user), Ok(seller)) if user.email == seller.email => format!(r#" (<a href="/listings/edit?id={}">Edit</a>)"#, id),
                                            _ => String::new()
                                        },
                                        listing.price,
                                        if listing.active {""} else {"<p><strong>This listing is no longer active.</strong> What follows is merely an archive of a prior listing.</p>"},
                                        if let Ok(user) = seller {
                                            format!(r#"<a href="mailto:{}">{}</a>"#, url_escape::encode_component(&user.email), escape_html(&user.email))
                                        } else {
                                            String::from("Error: Could not retrieve listing email.")
                                        },
                                        match listing.url {
                                            Some(url) => format!(r#"External purchase link: <a href="{}">{}</a>"#, url_escape::encode_component(&url), escape_html(&url)),
                                            None => String::from("There is no external purchase link. Contact the seller directly to make your purchase.")
                                        },
                                        match listing.description {
                                            Some(description) => {
                                                let mut desc: String = String::new();
                                                for line in description.split('\n').filter(|&x| !x.is_empty()) {
                                                    desc += "<p>";
                                                    desc += &escape_html(line);
                                                    desc += "</p>";
                                                }
                                                desc
                                            },
                                            None => String::new()
                                        },
                        ))).into_response()
                },
                Err(e) => match e {
                    ApiError::ClientError => Html(html("Invalid Listing", res.map(|user| user.email), "<h1>Invalid Listing</h1><p>This listing link is invalid.</p>")).into_response(),
                    ApiError::ServerError(e) => Html(html("Invalid Listing", res.map(|user| user.email), &format!("<h1>Server-Side Error</h1><p>Failed to query listings with following error: {}</p>", e))).into_response(),
                }
            }
        },
        Err(e) => e
    }
}
