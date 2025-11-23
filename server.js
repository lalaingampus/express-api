require("dotenv").config();

// === IMPORT CRON ===
require("./cron.js");

const app = require("./src/app");
const { sequelize } = require("./src/models");

// WAJIB: Railway selalu isi PORT → tidak perlu fallback
const PORT = process.env.PORT;

(async () => {
  try {
    console.log("🔌 Connecting to database...");
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`User: ${process.env.DB_USERNAME}`);

    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    await sequelize.sync({ alter: true });
    console.log("🗄️ Database synced successfully.");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📘 Swagger docs: /docs`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
})();
