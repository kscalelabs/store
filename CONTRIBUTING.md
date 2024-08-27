# Getting Started

To get started, check out the [Project tracker](https://github.com/orgs/kscalelabs/projects/8/views/1).

# Developing

To get started developing:

1. Clone the repository
2. Install the React dependencies and create a `.env.local` file
3. Install the FastAPI dependencies
4. Start the DynamoDB databases
5. Initialize the test databases
6. Serve the FastAPI application
7. Serve the React frontend

> [!IMPORTANT]
> You **MUST** access the locally run website through `127.0.0.1:3000` and **NOT** `localhost:3000`. This is because the CORS policy is configured to only allow requests from the exact domain `127.0.0.1:3000`.

> [!NOTE]
> You should develop the backend using Python 3.11 or later

### Configuration

Settings for the app backend live in the `store/settings/` directory. To configure which set of settings you are using, set `ENVIRONMENT`. It is the stem of one of the config files in the `store/settings/configs/` directory. When developing locally this should usually just be `local`

To locally develop, put the following environment variables in `env.sh` or `.env.local`

To run server/tests locally run: `source env.sh` or `source .env.local` in every new terminal depending on what you name the file.

Example `env.sh`/`.env.local` file:

```
# Specifies a local environment versus production environment.
export ENVIRONMENT=local

# For AWS
export AWS_DEFAULT_REGION='us-east-1'
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_ENDPOINT_URL_S3='http://127.0.0.1:4566'
export AWS_ENDPOINT_URL_DYNAMODB='http://127.0.0.1:4566'

# For letting the frontend know the backend URL.
export VITE_APP_BACKEND_URL='http://127.0.0.1:8080'

# For SMTP
export SMTP_HOST='smtp.gmail.com'
export SMTP_SENDER_EMAIL=''
export SMTP_PASSWORD=''
export SMTP_SENDER_NAME=''
export SMTP_USERNAME=''
```

### Google OAuth Configuration

The repository's local configuration comes with Google OAuth credentials for a test application. Alternatively, you can set up your own Google OAuth application to test the application locally, by following the instructions [here](https://blog.logrocket.com/guide-adding-google-login-react-app/).

### Github OAuth Configuration

The repository's local configuration comes with Github OAuth credentials for a test application. Alternatively, you can set up your own Github OAuth application to test the application locally:

1. Create an OAuth App on [Github Developer Settings](https://github.com/settings/developers)
2. Set both Homepage URL and Authorization callback URL to `http://127.0.0.1:3000/login` before you `Update application` on Github Oauth App configuration
3. Copy the Client ID and Client Secret from Github OAuth App configuration and set them in `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` respectively

## Database

### DynamoDB/S3

When developing locally, install the `aws` CLI and use the `localstack/localstack` Docker image to run a local instance of AWS:

```bash
docker pull localstack/localstack # If you haven't already
docker run -d --name localstack -p 4566:4566 -p 4571:4571 localstack/localstack
```

Then, if you need to kill the database, you can run:

```bash
docker kill localstack || true
docker rm localstack || true
```

Initialize the test databases by running the creation script:

```bash
python -m store.app.db create
```

And initialize the artifact bucket:

```
aws s3api create-bucket --bucket artifacts
aws s3api put-bucket-cors --bucket artifacts --cors-configuration file://local-cors-config.json
```

#### Admin Panel

DynamoDB Admin is a GUI that allows you to visually see your tables and their entries. To install, run

```bash
npm i -g dynamodb-admin
```

To run, **source the same environment variables that you use for FastAPI** and then run

```bash
DYNAMO_ENDPOINT=http://127.0.0.1:4566 dynamodb-admin
```

## FastAPI

Create a Python virtual environment using either [uv](https://astral.sh/blog/uv) or [virtualenv](https://virtualenv.pypa.io/en/latest/) with at least Python 3.11. This should look something like this:

```bash
uv venv .venv --python 3.11  # If using uv
python -m venv .venv  # Using vanilla virtualenv
source .venv/bin/activate
```

Install the project:

```bash
uv pip install -e '.[dev]'  # If using uv
pip install -e '.[dev]'  # Using vanilla pip
```

If the above is not sufficient and packages are missing you can also try running:

```bash
# Install dependencies from requirements files
uv pip install -r store/requirements.txt -r store/requirements-dev.txt # If using uv
```

Serve the FastAPI application in development mode:

```bash
make start-backend
```

### Keeping Frontend and Backend In Sync

After updating the backend API, you need to update the generated API client. To do this, from this `frontend` directory, run:

```bash
openapi-typescript http://localhost:8080/openapi.json --output src/gen/api.ts  # While running the backend API locally
```

## React

To install the React dependencies, use [nvm](https://github.com/nvm-sh/nvm) and [npm](https://www.npmjs.com/):

```bash
cd frontend
nvm use 20.10.0
npm install
```

To serve the React frontend in development mode:

```bash
npm run dev
```

To build the React frontend for production:

```bash
npm run build
```

To run code formatting:

```bash
npm run format
```

## Testing

To run the tests, you can use the following commands:

```bash
make test
make test-frontend  # Run only the frontend tests
make test-backend  # Run only the backend tests
```
