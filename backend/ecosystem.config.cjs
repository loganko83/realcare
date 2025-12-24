module.exports = {
  apps: [{
    name: "realcare-api",
    script: "/mnt/storage/real/backend/venv/bin/uvicorn",
    args: "app.main:app --host 0.0.0.0 --port 8092",
    cwd: "/mnt/storage/real/backend",
    interpreter: "none",
    env: {
      PATH: "/mnt/storage/real/backend/venv/bin:/usr/local/bin:/usr/bin:/bin",
      PYTHONPATH: "/mnt/storage/real/backend",
      SECRET_KEY: "${SECRET_KEY}",
      GOOGLE_CLIENT_ID: "${GOOGLE_CLIENT_ID}",
      GOOGLE_CLIENT_SECRET: "${GOOGLE_CLIENT_SECRET}",
      FRONTEND_URL: "https://trendy.storydot.kr/real"
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "500M",
    error_file: "/mnt/storage/real/backend/logs/error.log",
    out_file: "/mnt/storage/real/backend/logs/out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    merge_logs: true
  }]
};
