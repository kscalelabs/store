# frontend

This is the frontend of the project, which builds a static website using React.

## Setup

Install requirements:

```bash
cd frontend # This directory
nvm use v22.6.0
npm install
```

Start server:

```bash
npm run dev
```

Build static files:

```bash
npm run build
```

## Updating Backend API

After updating the backend API, you need to update the generated API client. To do this, from this `frontend` directory, run:

```bash
openapi-typescript http://localhost:8080/openapi.json --output src/gen/api.ts  # While running the backend API locally
```
