use super::traits::SqlTable;
use async_trait::async_trait;
use bb8::Pool;
use bb8_postgres::PostgresConnectionManager;
use postgres_types::{FromSql, ToSql};
use tokio_postgres::row::Row;
use tokio_postgres::NoTls;
use uuid::Uuid;

#[derive(Debug, ToSql, FromSql)]
pub struct Listing {
    /// A randomly generated 8-character alphanumeric string that uniquely identifies the order.
    /// (Also the url for the listing.)
    ///
    /// I currently have no strategy to deal with collisions we are just going to pray that doesn't
    /// happen.
    pub id: String,
    /// Which user posted this listing?
    /// Users are identified by ID.
    pub user_id: Uuid,
    /// We use i32 because at this scale the exact cents don't matter.
    /// So the integer represents the dollar price.
    /// (It's signed because the respective Postgres entry is signed.)
    pub price: i32,
    pub title: String,
    pub description: Option<String>,
    /// Optional external URL, such as an Amazon link. The inexistence of an external URL
    /// indicates that the buyer should directly contact the seller via email.
    pub url: Option<String>,
    pub active: bool,
}

impl TryFrom<Row> for Listing {
    type Error = tokio_postgres::error::Error;
    fn try_from(row: Row) -> Result<Self, Self::Error> {
        Ok(Self {
            id: row.try_get("id")?,
            user_id: row.try_get("user_id")?,
            price: row.try_get("price")?,
            title: row.try_get("title")?,
            description: row.try_get("description")?,
            url: row.try_get("url")?,
            active: row.try_get("active")?,
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
                    price       INTEGER         NOT NULL,
                    title       TEXT            NOT NULL,
                    description TEXT,
                    url         TEXT,
                    active      BOOL            NOT NULL,
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
                    "INSERT INTO {} (id, user_id, price, title, description, url, active) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                    Self::table_name()
                ),
                &[&self.id, &self.user_id, &self.price, &self.title, &self.description, &self.url, &self.active],
            )
            .await?;
        Ok(())
    }
}
