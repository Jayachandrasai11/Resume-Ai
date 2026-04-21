"""
Gunicorn Production Configuration — Optimized for Render 512MB Free Tier
=========================================================================
KEY SETTINGS:
  workers = 1          → Only ONE process. AI model is ~350MB alone.
                         2 workers = 700MB → instant SIGKILL.
  preload_app = True   → Load Django + AI model ONCE before forking.
                         Without this, each worker reloads the model = OOM.
  timeout = 120        → Give the AI embedding 120s to respond.
                         Default gunicorn timeout is 30s → kills AI mid-think.
  max_requests = 200   → Recycle worker after 200 requests to prevent
                         memory fragmentation / slow memory leaks.
"""
import os

# ── Worker Process Settings ────────────────────────────────────────────────
workers = 1                  # CRITICAL: Keep at 1 for 512MB Render tier
worker_class = "sync"        # Sync workers are most stable for CPU-bound AI
threads = 2                  # 2 threads within the single worker (safe)

# ── Timeout Settings ───────────────────────────────────────────────────────
timeout = 120                # 120s for embedding generation (DO NOT lower)
graceful_timeout = 30        # 30s for graceful shutdown
keepalive = 5

# ── Memory Management ──────────────────────────────────────────────────────
preload_app = True           # Load app ONCE before forking → saves ~200MB
max_requests = 200           # Restart worker after 200 requests (prevents leaks)
max_requests_jitter = 20     # Randomize restart to avoid thundering herd

# ── Binding ────────────────────────────────────────────────────────────────
port = int(os.environ.get("PORT", 8000))
bind = f"0.0.0.0:{port}"

# ── Logging ────────────────────────────────────────────────────────────────
accesslog = "-"              # Log to stdout (visible in Render dashboard)
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s %(f)s "%(a)s" %(D)sms'

# ── Server Hooks ───────────────────────────────────────────────────────────
def post_fork(server, worker):
    """Called after worker fork. Force single-threaded torch for safe RAM."""
    try:
        import torch
        torch.set_num_threads(1)
        server.log.info(f"Worker {worker.pid}: torch threads capped to 1")
    except ImportError:
        pass


def worker_exit(server, worker):
    """Called when a worker exits. Log it clearly for debugging."""
    server.log.info(f"Worker {worker.pid} exited. Checking for OOM...")
