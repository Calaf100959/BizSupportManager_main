module.exports = {
  apps: [
    {
      name: "bizsupport",
      script: "dist/index.js",
      cwd: "/var/www/bizsupport",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env_file: "/var/www/bizsupport/.env",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      error_file: "/var/log/pm2/bizsupport-error.log",
      out_file:   "/var/log/pm2/bizsupport-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
