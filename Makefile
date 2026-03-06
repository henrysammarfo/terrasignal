# Makefile for TerraSignal Python agent
# Windows: use `py -m venv .venv` and `.venv\Scripts\activate` then `make` targets with mingw32-make or use the commands below.

PYTHON ?= python
PIP ?= pip

.PHONY: venv install dev demo test run run-once

venv:
	$(PYTHON) -m venv .venv
	@echo "Activate with: .venv\\Scripts\\activate (Windows) or source .venv/bin/activate (Mac/Linux)"

install: venv
	$(PIP) install -r requirements.txt

dev: install
	$(PIP) install -e .

demo:
	$(PYTHON) demo.py

run:
	$(PYTHON) main.py run

run-once:
	$(PYTHON) main.py run --once

test:
	$(PYTHON) -m pytest tests/ -v
