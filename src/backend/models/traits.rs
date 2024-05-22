use crate::ApiError;
use async_trait::async_trait;
use bb8::Pool;
use bb8_postgres::PostgresConnectionManager;
use postgres_types::ToSql;
use std::fmt::Debug;
use strum::IntoEnumIterator;
use tokio_postgres::row::Row;
use tokio_postgres::NoTls;

/// The trait that allows a struct to be represented as an SQL table
#[async_trait]
pub trait SqlTable: Sized + TryFrom<Row> {
    /// The name of the table in the SQL database
    ///
    /// This function is to be manually written for every struct.
    fn table_name() -> String;
    /// The SQL query that creates a table for the struct in the SQL database
    ///
    /// This function is to be manually written for every struct.
    fn create_query() -> String;
    /// The SQL query that retrieves an object from the table.
    ///
    /// This function is automatically generated.
    async fn get_one<T: ToSql + Sync + std::marker::Send>(
        field: &str,
        value: T,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<Self, ApiError> {
        let connection = match pool.get().await {
            Ok(c) => c,
            Err(_) => {
                return Err(ApiError::ServerError(String::from(
                    "Failed to get connection from connection pool.",
                )))
            }
        };
        match connection
            .query_one(
                &format!("SELECT * FROM {} WHERE {} = $1", Self::table_name(), field,),
                &[&value],
            )
            .await
        {
            Ok(row) => match Self::try_from(row) {
                Ok(o) => Ok(o),
                Err(_) => Err(ApiError::ServerError(String::from(
                    "Could not convert Postgres row into struct object.",
                ))),
            },
            // No such row exists. Whatever identifier the client passed should be considered
            // invalid.
            Err(_) => Err(ApiError::ClientError),
        }
    }
    /// The SQL query that gets all objects from a table.
    ///
    /// This function is automatically generated.
    ///
    /// I really hate the function signature but I can't even coerce everything into a
    /// `Box<dyn Error>`, so no Result.
    async fn get_all(pool: &Pool<PostgresConnectionManager<NoTls>>) -> Option<Vec<Self>> {
        let connection = match pool.get().await {
            Ok(c) => c,
            Err(_) => return None,
        };
        let rows = match connection
            .query(&format!("SELECT * FROM {}", Self::table_name()), &[])
            .await
        {
            Ok(r) => r,
            Err(_) => return None,
        };
        match rows.into_iter().map(|row| Self::try_from(row)).collect() {
            Ok(v) => Some(v),
            Err(_) => None,
        }
    }
    /// The SQL query that gets all objects from a table
    /// satisfying a certain condition (filter).
    ///
    /// This function is automatically generated.
    ///
    /// I really hate the function signature but I can't even coerce everything into a
    /// `Box<dyn Error>`, so no Result.
    async fn get_all_filtered<T: ToSql + Sync + std::marker::Send>(field: &str, value: T, pool: &Pool<PostgresConnectionManager<NoTls>>) -> Option<Vec<Self>> {
        let connection = match pool.get().await {
            Ok(c) => c,
            Err(_) => return None,
        };
        let rows = match connection
            .query(&format!("SELECT * FROM {} WHERE {} = $1", Self::table_name(), field), &[&value])
            .await
        {
            Ok(r) => r,
            Err(_) => return None,
        };
        match rows.into_iter().map(|row| Self::try_from(row)).collect() {
            Ok(v) => Some(v),
            Err(_) => None,
        }
    }
    /// The SQL query that inserts an object into the table.
    ///
    /// This function is to be manually written for every struct.
    async fn insert(
        &self,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<(), bb8::RunError<tokio_postgres::error::Error>>;
    /// The SQL query that deletes objects from the table.
    ///
    /// This function is automatically generated.
    async fn delete(
        field: &str,
        value: &str,
        pool: &Pool<PostgresConnectionManager<NoTls>>,
    ) -> Result<(), bb8::RunError<tokio_postgres::error::Error>> {
        let connection = pool.get().await?;
        connection
            .execute(
                &format!("DELETE FROM {} WHERE {} = $1", Self::table_name(), field),
                &[&value],
            )
            .await?;
        Ok(())
    }
}

/// The trait that allows an enum to be represented as an SQL enum
pub trait SqlEnum: IntoEnumIterator + Debug {
    /// The name of the enum in the SQL database
    ///
    /// This function is to be manually written for every struct. Unfortunately, there is some
    /// redundancy since we also specify the enum name with
    ///     #[postgres(name = "ENUM_NAME")]
    fn enum_name() -> String;
    /// The SQL query that creates an enum type for the enum in the SQL database
    ///
    /// This function is automatically generated using the information exposed by Strum
    fn create_query() -> String {
        let variants: Vec<String> = Self::iter().map(|v| format!("'{:?}'", v)).collect();
        format!(
            "DO $$ BEGIN
                CREATE TYPE {} AS ENUM ({});
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;",
            Self::enum_name(),
            variants.join(", ")
        )
    }
}
