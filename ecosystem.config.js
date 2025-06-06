module.exports = {
  apps: [{
    name: 'chipflow-dev',
    script: 'npm',
    args: 'run dev',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    watch: true,
    ignore_watch: ['node_modules', '.git', '.next'],
    env_production: {
      NODE_ENV: 'production'
    }
  }]
} 