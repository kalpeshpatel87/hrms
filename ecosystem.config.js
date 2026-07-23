// PM2 process file for a non-Docker deployment (Docker/Compose is the
// primary path — see docker-compose.yml — this is the alternative for hosts
// that run pnpm/node directly). Build both apps first:
//   pnpm --filter api prisma:generate && pnpm --filter api build
//   pnpm --filter web build
// then: pm2 start ecosystem.config.js --env production

export default {
  apps: [
    {
      name: 'atyantik-api',
      cwd: './apps/api',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '512M',
      out_file: '../../logs/api.out.log',
      error_file: '../../logs/api.error.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'atyantik-web',
      cwd: './apps/web',
      script: 'build/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '256M',
      out_file: '../../logs/web.out.log',
      error_file: '../../logs/web.error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
