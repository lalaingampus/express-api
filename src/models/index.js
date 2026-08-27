const { Sequelize } = require('sequelize');
const dbConfig = require('../config/config');

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    ...dbConfig,
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    port: dbConfig.port,
    // Serverless optimizations
    pool: {
      max: isProduction ? 1 : 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: false,
    // Prevent connection issues on serverless
    retry: { max: 3 },
  }
);

// Import semua model
const User = require('./user')(sequelize);
const Pemasukan = require('./pemasukan')(sequelize);
const Pengeluaran = require('./pengeluaran')(sequelize);
const Hutang = require('./hutang')(sequelize);
const NB = require('./nb')(sequelize);
const RekapPemasukan = require('./rekappemasukan')(sequelize);
const RekapPengeluaran = require('./rekappengeluaran')(sequelize);

// ====== RELASI ANTAR MODEL ======
User.hasMany(Pemasukan, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Pengeluaran, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Hutang, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(NB, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(RekapPemasukan, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(RekapPengeluaran, { foreignKey: 'userId', onDelete: 'CASCADE' });

Pemasukan.belongsTo(User, { foreignKey: 'userId' });
Pengeluaran.belongsTo(User, { foreignKey: 'userId' });
Hutang.belongsTo(User, { foreignKey: 'userId' });
NB.belongsTo(User, { foreignKey: 'userId' });
RekapPemasukan.belongsTo(User, { foreignKey: 'userId' });
RekapPengeluaran.belongsTo(User, { foreignKey: 'userId' });

// Relasi Pemasukan → Pengeluaran
Pemasukan.hasMany(Pengeluaran, { foreignKey: 'selectedSumber', onDelete: 'SET NULL' });
Pengeluaran.belongsTo(Pemasukan, { foreignKey: 'selectedSumber', as: 'sumber' });

// Export a function to test connection on-demand
const testConnection = () => sequelize.authenticate();

module.exports = {
  sequelize,
  User,
  Pemasukan,
  Pengeluaran,
  Hutang,
  NB,
  RekapPemasukan,
  RekapPengeluaran,
  testConnection,
};
