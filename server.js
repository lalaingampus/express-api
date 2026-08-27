require('dotenv').config();

const app = require('./src/app');
const { sequelize } = require('./src/models');
const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 3090; // WAJIB
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';

(async () => {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    await sequelize.sync({ alter: true });
    console.log('🗄️ Database synced successfully.');

    const admin = await User.findOne({ where: { username: 'admin' } });
    if (!admin) {
      const hashed = await bcrypt.hash('admin123', 10);
      await User.create({ username: 'admin', email: 'admin@local', password: hashed });
      console.log('✅ Default admin created: admin / admin123');
    }

    if (!isVercel) {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);

        // CRON BARU RUN SETELAH SERVER READY (non-Vercel only)
        require('./cron.js');

        console.log(`📘 Swagger docs: /docs`);
      });
    } else {
      console.log('📦 Running on Vercel (serverless)');
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
})();
