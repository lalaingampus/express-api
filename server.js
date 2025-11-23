require('dotenv').config();

const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT; // WAJIB

(async () => {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    await sequelize.sync({ alter: true });
    console.log('🗄️ Database synced successfully.');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);

      // CRON BARU RUN SETELAH SERVER READY
      require('./cron.js');

      console.log(`📘 Swagger docs: /docs`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
})();
