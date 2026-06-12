const app = require("./app");
const { testConnection } = require("./config/database");

const PORT = process.env.PORT || 5000;

async function startServer() {
  await testConnection();

  app.listen(PORT, () => {
    console.log(`HRSpace API running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Unable to start server:", error.message);
  process.exit(1);
});
