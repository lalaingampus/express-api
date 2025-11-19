const { Sequelize } = require('sequelize');
const dbConfig = require('../config/config');

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database successfully!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
})();

module.exports = sequelize;
