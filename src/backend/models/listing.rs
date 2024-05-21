use uuid::Uuid;
use postgres_types::{FromSql, ToSql};

#[derive(Debug, ToSql, FromSql)]
pub struct Listing {
    /// A randomly generated 8-character alphanumeric string that uniquely identifies the order.
    /// (Also the url for the listing.)
    ///
    /// I currently have no strategy to deal with collisions we are just going to pray that doesn't
    /// happen.
    id: String,
    /// Which user posted this listing?
    /// Users are identified by ID.
    user_id: Uuid,
    title: String,
    description: Option<String>,
    /// Optional external URL, such as an Amazon link. The inexistence of an external URL
    /// indicates that the buyer should directly contact the seller via email.
    url: Option<String>
}

impl TryFrom<Row> for Listing {
    type Error = tokio_postgres::error::Error;
    fn try_from(row: Row) -> Result<Self, Self::Error> {
        Ok(Self {
            id: row.try_get("id")?,
            user_id: row.try_get("user_id")?,
            title: row.try_get("title")?,
            description: row.try_get("description")?,
            url: row.try_get("url")?,
        })
    }
}

#[async_trait]
impl SqlTable for Listing {
    fn table_name() -> String {
        String::from("listings")
    }
    fn create_query() -> String {
        format!(
                "CREATE TABLE IF NOT EXISTS {} (
                    id          VARCHAR (8)     NOT NULL UNIQUE,
                    user_id     UUID            NOT NULL,
                    title       TEXT            NOT NULL,
                    description TEXT,
                    url         TEXT
                )",
                Self::table_name(),
            )
    }
    async fn insert(
        &self,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<(), bb8::RunError<tokio_postgres::error::Error>> {
        let connection = pool.get().await?;
        connection
            .execute(
                &format!(
                    "INSERT INTO {} (id, user_id, title, description, url) VALUES ($1, $2, $3, $4, $5)",
                    Self::table_name()
                ),
                &[&self.id, &self.user_id, &self.title, &self.description, &self.url],
            )
            .await?;
        Ok(())
    }
}
