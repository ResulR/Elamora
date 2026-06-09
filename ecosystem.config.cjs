module.exports = {
  apps: [
    {
      name: "elamora-web",
      cwd: "/home/debian/apps/elamora",
      script: "npm",
      args: "run preview -- --host 127.0.0.1 --port 3200",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "400M",
      autorestart: true,
    },
    {
      name: "elamora-api",
      cwd: "/home/debian/apps/elamora/server",
      script: "dist/index.js",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "400M",
      autorestart: true,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
