module.exports = {
  apps: [
    {
      name: 'mailhub-server',
      cwd: '/var/www/private-mailhub/back-end',
      script: './dist/main.js',
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        WORKER_MODE: 'false'
      },
      error_file: '/var/log/pm2/mailhub-web-error.log',
      out_file: '/var/log/pm2/mailhub-web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    },
    {
      name: 'mailhub-worker',
      cwd: '/var/www/private-mailhub/back-end',
      script: './dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        WORKER_MODE: 'true'
      },
      error_file: '/var/log/pm2/mailhub-worker-error.log',
      out_file: '/var/log/pm2/mailhub-worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ]
};
