require("dotenv").config();

const app = require("./src/app");
const { sequelize } = require("./src/models");

const PORT = process.env.PORT;

(async () => {
  try {
    console.log("🔌 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    await sequelize.sync({ alter: true });
    console.log("🗄️ Database synced successfully.");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📘 Swagger docs: /docs`);

      // === CRON JALAN SETELAH SERVER SIAP ===
      require("./cron.js");
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
})();
