use backend::config::Config;
use backend::models::traits::SqlTable;
use backend::models::user::{AuthCookie, ChangeEmailCode, InviteCode, User};
use bb8::Pool;
use bb8_postgres::PostgresConnectionManager;
use tokio_postgres::NoTls;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let config = Config::get();

    let mut pg_config = tokio_postgres::config::Config::new();
    pg_config
        .host("localhost")
        .dbname(&config.postgres.dbname)
        .user(&config.postgres.user)
        .password(&config.postgres.password);

    let manager = PostgresConnectionManager::new(pg_config, NoTls);
    let pool = Pool::builder().build(manager).await?;
    let connection = pool.get().await?;

    connection
        .batch_execute(&AuthCookie::create_query())
        .await?;
    connection
        .batch_execute(&InviteCode::create_query())
        .await?;
    connection
        .batch_execute(&ChangeEmailCode::create_query())
        .await?;
    connection.batch_execute(&User::create_query()).await?;

    Ok(())
}
