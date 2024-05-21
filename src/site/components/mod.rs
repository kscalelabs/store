mod navbar;

/// Given a title, email to input for the navbar, and body, generate an HTML response
///
/// Whatever code is used to generate the body should also be used to generate the username. This
/// way, we are more efficient with our SQL queries.
pub fn html(title: &str, email: Option<String>, body: &str) -> String {
    format!(
        r#"
        <!DOCTYPE HTML>
        <html lang="en">
            <head>
                <title>{}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="/main.css">
                <link rel="icon" href="/favicon.ico">
            </head>
            <body>
                {}
                <main>
                    {}
                </main>
            </body>
        </html>
    "#,
        title,
        navbar::navbar(email),
        body
    )
}
