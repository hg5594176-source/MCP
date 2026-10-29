# Agent Safety Gate – Makefile
# Targets: install  test  demo  bench  server  verify  clean

PYTHON = python
UVICORN = uvicorn
PORT = 8000
DB = gate_audit.db

.PHONY: install test demo bench server verify clean help

help:
	@echo ""
	@echo "Agent Safety Gate – available targets:"
	@echo "  make install   Install all Python dependencies"
	@echo "  make test      Run all 120 pytest tests"
	@echo "  make demo      Run the reckless agent side-by-side demo"
	@echo "  make bench     Run the 25-scenario benchmark"
	@echo "  make server    Start the FastAPI dashboard (http://localhost:$(PORT))"
	@echo "  make verify    Verify the audit log hash chain"
	@echo "  make clean     Remove generated files"
	@echo ""

install:
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install \
	    fastapi uvicorn pydantic pyyaml \
	    pytest pytest-asyncio httpx \
	    mcp

test:
	$(PYTHON) -m pytest tests/ -v --tb=short

demo:
	$(PYTHON) -m demo.reckless_agent --compare

bench:
	$(PYTHON) -m demo.benchmark

server:
	$(UVICORN) main:app --host 0.0.0.0 --port $(PORT) --reload

verify:
	$(PYTHON) -c "\
from gate.audit.log import AuditLog; \
ok, errors = AuditLog('$(DB)').verify(); \
print('AUDIT LOG OK – hash chain intact.' if ok else 'TAMPERING DETECTED:'); \
[print(' -', e) for e in errors]"

clean:
	del /Q $(DB) 2>NUL || true
	del /Q benchmark_results.json 2>NUL || true
	rmdir /S /Q .pytest_cache 2>NUL || true
	for /d /r . %%d in (__pycache__) do @rmdir /s /q "%%d" 2>NUL

