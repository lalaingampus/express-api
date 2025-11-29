const { Sequelize } = require('sequelize');
const dbConfig = require('../config/config');

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
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

module.exports = {
  sequelize,
  User,
  Pemasukan,
  Pengeluaran,
  Hutang,
  NB,
  RekapPemasukan,
  RekapPengeluaran,
};
