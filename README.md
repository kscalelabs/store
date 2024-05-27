# store

This is the code for our online store. This is a simple store for buying and selling humanoid robots.

## Development

To develop the application, start FastAPI and React in separate terminals:

### FastAPI

Serve the FastAPI application in development mode:

```bash
fastapi dev 'store/app/main.py'
```

#### Configuration

Settings for the app backend live in the `store/settings/` directory. You can use the following environment variables:

- `ROBOLIST_ENVIRONMENT_SECRETS` should be the path to a local `.env` file containing any environment secrets
- `ROBOLIST_ENVIRONMENT` is the stem of one of the config files in the `store/settings/configs/` directory. When developing locally this should usually just be `local`

#### Database

When developing locally, use the `amazon/dynamodb-local` Docker image to run a local instance of DynamoDB:

```bash
docker pull amazon/dynamodb-local  # If you haven't already
docker run -d -p 8080:8080 amazon/dynamodb-local  # Start the container in the background
```

Create a test database by running the creation script:

```bash
python -m store.app.api.db
```

### React

Automatically rebuild the React frontend code when a file is changed:

```bash
cd frontend
nvm use 20.10.0  # If you're using nvm
npm install  # If you haven't already
npm run watch
```
