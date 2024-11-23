# Makefile

define HELP_MESSAGE
store

# Installing

1. Create a new Conda environment: `conda create --name store python=3.11`
2. Activate the environment: `conda activate store`
3. Install the package: `make install-dev`

# Running Tests

1. Run autoformatting: `make format`
2. Run static checks: `make static-checks`
3. Run unit tests: `make test`

endef
export HELP_MESSAGE

all:
	@echo "$$HELP_MESSAGE"
.PHONY: all

# ------------------------ #
#          Serve           #
# ------------------------ #

start-backend:
	@if [ -f env.sh ]; then source env.sh; fi; fastapi dev 'store/app/main.py' --port 8080

start-frontend:
	@if [ -f env.sh ]; then source env.sh; fi; cd frontend && npm run dev

update-api:
	@cd frontend && rm -rf src/gen/api.ts && openapi-typescript http://localhost:8080/openapi.json --output src/gen/api.ts

start-docker-dynamodb:
	@docker kill store-db || true
	@docker rm store-db || true
	@docker run --name store-db -d -p 8000:8000 amazon/dynamodb-local

start-docker-backend:
	@docker kill store-backend || true
	@docker rm store-backend || true
	@docker build -t store-backend .
	@docker run --name store-backend -d -p 8080:8080 store-backend

start-docker-localstack:
	@docker kill store-localstack || true
	@docker rm store-localstack || true
	@docker run -d --name store-localstack -p 4566:4566 -p 4571:4571 localstack/localstack

# ------------------------ #
#      Code Formatting     #
# ------------------------ #

format-backend:
	@black store tests
	@ruff check --fix store tests
.PHONY: format

format-frontend:
	@cd frontend && npm run format
.PHONY: format

format: format-backend format-frontend
.PHONY: format

# ------------------------ #
#       Static Checks      #
# ------------------------ #

static-checks-backend:
	@black --diff --check store tests
	@ruff check store tests
	@mypy --install-types --non-interactive store tests
.PHONY: lint

static-checks-frontend:
	@cd frontend && npm run lint
.PHONY: lint

static-checks: static-checks-backend static-checks-frontend
.PHONY: lint

# ------------------------ #
#        Unit tests        #
# ------------------------ #

test-backend:
	@python -m pytest

test-frontend:
	@cd frontend && npm run test -- --watchAll=false

# test: test-backend test-frontend
test: test-backend

.PHONY: test
