# Makefile

# ------------------------ #
#          Serve           #
# ------------------------ #

start-backend:
	@if [ -f env.sh ]; then source env.sh; fi; fastapi dev 'store/app/main.py' --port 8080

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

format:
	@black store tests
	@ruff check --fix store tests
.PHONY: format

# ------------------------ #
#       Static Checks      #
# ------------------------ #

lint:
	@black --diff --check store tests
	@ruff check store tests
	@mypy --install-types --non-interactive store tests
.PHONY: lint

# ------------------------ #
#        Unit tests        #
# ------------------------ #

test-backend:
	@python -m pytest
.PHONY: test-backend

# test: test-backend test-frontend
test: test-backend
.PHONY: test
