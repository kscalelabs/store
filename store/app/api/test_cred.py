
import boto3
from botocore.exceptions import NoCredentialsError, PartialCredentialsError


def test_dynamodb_connection() -> None:
    try:
        # Initialize DynamoDB client
        dynamodb = boto3.resource('dynamodb')
        # Attempt to list tables as a test
        tables = list(dynamodb.tables.all())
        print(f"Connected to DynamoDB. Found tables: {[table.name for table in tables]}")
    except NoCredentialsError:
        print("No credentials found. Please configure your AWS credentials.")
    except PartialCredentialsError:
        print("Incomplete credentials found. Please check your AWS credentials.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_dynamodb_connection()
