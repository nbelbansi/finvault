module.exports = {
  apps: [
    {
      name: 'finvault',
      script: './apps/api/dist/index.js',
      cwd: '/var/www/finvault',
      instances: 1,
      autorestart: true,
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
};
