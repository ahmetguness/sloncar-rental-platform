module.exports = {
  apps: [
    {
      name: "sloncar-backend",
      script: "./dist/server.js",
      cwd: "/var/wwwsloncar/sloncar-rental-platform/backend",
      env: {
        NODE_ENV: "production",
        PORT: "4000",
        DATABASE_URL: "postgresql://sloncar_user:ahmeT2423@localhost:5432/sloncar?schema=public",
      },
    },
  ],
};
