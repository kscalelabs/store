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

start-fastapi:
	@fastapi dev 'store/app/main.py' --port 8080

start-docker:
	@docker kill store-db || true
	@docker rm store-db || true
	@docker run --name store-db -d -p 8000:8000 amazon/dynamodb-local

# ------------------------ #
#       Static Checks      #
# ------------------------ #

format:
	@black store
	@ruff format store
	@cd frontend && npm run format
.PHONY: format

static-checks:
	@black --diff --check store
	@ruff check store
	@mypy --install-types --non-interactive store
	@cd frontend && npm run lint
.PHONY: lint

# ------------------------ #
#        Unit tests        #
# ------------------------ #

test-backend:
	@python -m pytest

test-frontend:
	@cd frontend && npm run test -- --watchAll=false

test: test-backend test-frontend

.PHONY: test
