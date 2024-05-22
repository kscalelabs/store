use crate::routes::html;
use crate::utils::{escape_html, parse_cookie, serde::empty_to_none};
use axum::extract::Query;
use axum::http::StatusCode;
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
    match parse_cookie(cookies, "Listing", &pool).await {
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
                                            format!(r#"<a href="mailto:{}">{}</a>"#, escape_html(&user.email), escape_html(&user.email))
                                        } else {
                                            String::from("Error: Could not retrieve listing email.")
                                        },
                                        match listing.url {
                                            Some(url) => format!(r#"External purchase link: <a href="{}">{}</a>"#, escape_html(&url), escape_html(&url)),
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

pub async fn get_edit_main(
    cookies: Cookies,
    Extension(pool): Extension<Pool<PostgresConnectionManager<NoTls>>>,
) -> Response {
    match parse_cookie(cookies, "Edit Your Listings", &pool).await {
        Ok(res) => match res {
            Some(user) => match Listing::get_all_filtered("user_id", user.uuid, &pool).await {
                Some(listings) => {
                    let mut res: String = String::from("<h1>Edit Your Listings</h1>");
                    for listing in listings {
                        res += &format!(
                            r#"<div class="listing">
                                <div class="listing-title"><a href="listings?id={}">{}</a>
                                </div>
                                <div class="listing-price">${}</div>
                            </div>"#,
                            listing.id,
                            escape_html(&listing.title),
                            listing.price,
                        )
                    }
                    Html(html("Edit Your Listings", Some(user.email), &res)).into_response()
                },
                None => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
            },
            None => Redirect::to("/").into_response()
        },
        Err(e) => e
    }
}

pub async fn get_edit_listing(
    cookie: Cookies,
    Query(Id { id }): Query<Id>,
    Extension(pool): Extension<Pool<PostgresConnectionManager<NoTls>>>,
) -> Response {
    match parse_cookie(cookie, "Edit Listing", &pool).await {
        Ok(res) => {
            match res {
                Some(user) => match Listing::get_one("id", &id, &pool).await {
                    Ok(listing) => if listing.user_id == user.uuid {
                        Html(html(
                            &listing.title,
                            Some(user.email),
                            &format!(
                                r#"<h1>Edit {}</h1>
                                    <p>If an external purchase link is not provided, the buyer will directly contact you through email to arrange the purchase.</p>
                                    <form action="/listings/edit" method="POST">
                                    <input name="id" type="hidden" value={}>
                                    <div>
                                        <label for="title">Title (descriptive)*</label>
                                        <input name="title" required type="text" value={}>
                                    </div>
                                    <div>
                                        <label for="price">Price (in dollars)*</label>
                                        <input name="price" required type="text" value={}>
                                    </div>
                                    <div>
                                        <label for="description">Description<label>
                                        <textarea name="description" rows="20">{}</textarea>
                                    </div>
                                    <div>
                                        <label for="url">External Purchase Link<label>
                                        <input name="url" type="text" value={}>
                                    </div>
                                    <div>
                                        <input type="radio" name="active" value="true"{}>
                                        <label for="admin">Make posting active</label>
                                    </div>
                                    <div>
                                        <input type="radio" name="active" value="false"{}>
                                        <label for="admin">Deactivate posting</label>
                                    </div>
                                    <button type="submit">Edit</submit>
                                "#,
                                escape_html(&listing.title),
                                id,
                                escape_html(&listing.title),
                                listing.price,
                                match listing.description {
                                    Some(desc) => escape_html(&desc),
                                    None => String::new(),
                                },
                                &match listing.url {
                                    Some(url) => escape_html(&url),
                                    None => String::new(),
                                },
                                if listing.active { r#"checked="""# } else { "" },
                                if listing.active { "" } else { r#"checked="""# },
                            ))).into_response()
                    } else {
                        Html(html("No Permissions", Some(user.email), "<h1>No Permissions</h1><p>You do not have permission to edit this listing, likely because you are not the user who created it.</p>")).into_response()
                    },
                    Err(e) => match e {
                        ApiError::ClientError => Html(html("Invalid Listing", Some(user.email), "<h1>Invalid Listing</h1><p>This listing link is invalid.</p>")).into_response(),
                        ApiError::ServerError(e) => Html(html("Invalid Listing", Some(user.email), &format!("<h1>Server-Side Error</h1><p>Failed to query listings with following error: {}</p>", e))).into_response(),
                    }
                },
                None => Html(html("No Permissions", None, "<h1>No Permissions</h1><p>You must be logged in to edit this listing.</p>")).into_response()
            }
        },
        Err(e) => e,
    }
}

#[derive(Deserialize)]
pub struct EditRequest {
    id: String,
    title: String,
    price: i32,
    #[serde(deserialize_with = "empty_to_none")]
    description: Option<String>,
    #[serde(deserialize_with = "empty_to_none")]
    url: Option<String>,
    active: bool,
}

pub async fn post_edit_listing(
    cookies: Cookies,
    Extension(pool): Extension<Pool<PostgresConnectionManager<NoTls>>>,
    Form(EditRequest {
        id,
        title,
        price,
        description,
        url,
        active,
    }): Form<EditRequest>,
) -> Response {
    match parse_cookie(cookies, "Edit Listing", &pool).await {
        Ok(res) => match res {
            Some(user) => {
                match Listing::get_one("id", &id, &pool).await {
                    Ok(listing) => {
                        if listing.user_id == user.uuid {
                            match Listing::edit(&id, &title, price, description, url, active, &pool).await {
                                Ok(()) => Redirect::to(&format!("/listings?id={}", id)).into_response(),
                                Err(e) => Html(html("Edit Listing", Some(user.email), &format!("<h1>Edit Listing</h1><p>Serverside error encountered when trying to edit listing: {}</p><p>Please resubmit your edit. (You may resubmit your edit by simply refreshing the page.)</p>", e))).into_response()
                            }
                        } else {
                            Html(html("No Permissions", Some(user.email), "<h1>No Permissions</h1><p>You do not have permission to edit this listing, likely because you are not the user who created it.</p>")).into_response()
                        }
                    },
                    Err(e) => match e {
                        ApiError::ClientError => Html(html("Invalid Listing", Some(user.email), "<h1>Invalid Listing</h1><p>This listing link is invalid.</p>")).into_response(),
                        ApiError::ServerError(e) => Html(html("Invalid Listing", Some(user.email), &format!("<h1>Server-Side Error</h1><p>Failed to query listings with following error: {}</p>", e))).into_response(),
                    }
                }
            },
            None => Html(html("No Permissions", None, "<h1>No Permissions</h1><p>You must be logged in to edit this listing.</p>")).into_response()
        },
        Err(e) => e,
    }
}
