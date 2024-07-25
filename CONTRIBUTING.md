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

And initialize the image bucket:

```
aws s3api create-bucket --bucket images
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

Serve the FastAPI application in development mode:

```bash
ROBOLIST_ENVIRONMENT=local fastapi dev 'store/app/main.py' --port 8080  # On port 8080 to avoid conflicts with Docker
```

### Configuration

Settings for the app backend live in the `store/settings/` directory. To configure which set of settings you are using, set `ROBOLIST_ENVIRONMENT`. It is the stem of one of the config files in the `store/settings/configs/` directory. When developing locally this should usually just be `local`

To locally develop, put these following environment variables in .env file and when you run the server locally, uvicorn will pickup these variables automatically:

```
# Specifies a local environment verses production environment.
export ROBOLIST_ENVIRONMENT=local

# For AWS
AWS_DEFAULT_REGION='us-east-1'
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT_URL_DYNAMODB=http://127.0.0.1:4566

# For letting the frontend know the backend URL.
REACT_APP_BACKEND_URL=http://127.0.0.1:8080

# For SMTP
SMTP_HOST=smtp.gmail.com
SMTP_SENDER_EMAIL=
SMTP_PASSWORD=
SMTP_SENDER_NAME=
SMTP_USERNAME=

# For Github OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# For Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Github OAuth Configuration

To run Github OAuth locally, you must follow these steps:

1. Create an OAuth App on [Github Developer Settings](https://github.com/settings/developers)
2. Set both Homepage URL and Authorization callback URL to `http://127.0.0.1:3000/login` before you `Update application` on Github Oauth App configuration
3. Copy the Client ID and Client Secret from Github OAuth App configuration and set them in `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` respectively

## React

To install the React dependencies, use [nvm](https://github.com/nvm-sh/nvm) and [npm](https://www.npmjs.com/):

```bash
cd frontend
nvm use 20.10.0
npm install
```

To serve the React frontend in development mode:

```bash
npm start
```

To build the React frontend for production:

```bash
npm run build
```

To run code formatting:

```bash
npm run format
```

### Google Client ID

You will need to set `REACT_APP_GOOGLE_CLIENT_ID`. To do this, first create a Google client id (see [this LogRocket post](https://blog.logrocket.com/guide-adding-google-login-react-app/)). Then create a `.env.local` file in the `frontend` directory and add the following line:

```
REACT_APP_GOOGLE_CLIENT_ID=your-client-id
```

Additionally, you should set `REACT_APP_BACKEND_URL` to the URL of the FastAPI backend. This should be `http://127.0.0.1:8080` when developing locally.

## Testing

To run the tests, you can use the following commands:

```bash
make test
make test-frontend  # Run only the frontend tests
make test-backend  # Run only the backend tests
```
