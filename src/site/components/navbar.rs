use crate::utils::escape_html;

/// Generates the HTML for the navbar based on the email of the logged in account and the current
/// URL path
pub fn navbar(email: Option<String>) -> String {
    let nav_links = match email {
        Some(email) => format!(
            r#"<a class="nav nav-link" href="/settings">{}</a><a class="nav nav-link" href="/logout">Logout</a>"#,
            escape_html(&email)
        ),
        None => String::from(
            r#"<a class="nav nav-link" href="register">Register</a><a class="nav nav-link" href="/login">Login</a>"#,
        ),
    };
    format!(
        r#"
        <nav>
            <a class="nav nav-home" href="/">K-Scale Store</a>
            {}
        </nav>
    "#,
        nav_links
    )
}
