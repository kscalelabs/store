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
#          Build           #
# ------------------------ #

install:
	@pip install --verbose -e .
.PHONY: install

install-dev:
	@pip install --verbose -e '.[dev]'
.PHONY: install

build-ext:
	@python setup.py build_ext --inplace
.PHONY: build-ext

clean:
	rm -rf build dist *.so **/*.so **/*.pyi **/*.pyc **/*.pyd **/*.pyo **/__pycache__ *.egg-info .eggs/ .ruff_cache/
.PHONY: clean

# ------------------------ #
#       Static Checks      #
# ------------------------ #

format:
	@black store
	@ruff format store
.PHONY: format

static-checks:
	@black --diff --check store
	@ruff check store
	@mypy --install-types --non-interactive store
.PHONY: lint

# ------------------------ #
#        Unit tests        #
# ------------------------ #

test:
	python -m pytest
.PHONY: test
