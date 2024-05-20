use lettre::{message::Mailbox, Message};

/// Constructs a Message object from lettre
pub fn message(
    name: &str,
    from: &str,
    to: &str,
    subject: &str,
    body: &str,
) -> Result<Message, Box<dyn std::error::Error + Sync + Send>> {
    Ok(Message::builder()
        .from(Mailbox {
            name: Some(String::from(name)),
            email: from.parse()?,
        })
        .to(to.parse()?)
        .subject(subject)
        .body(String::from(body))?)
}
