const { Sequelize } = require('sequelize');
const dbConfig = require('../config/config');

let sequelize = null;
let models = null;

function getSequelize() {
  if (!sequelize) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Validate required env vars
    const required = ['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }

    // Explicitly require pg to ensure it's bundled
    const pg = require('pg');
    
    sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        ...dbConfig,
        host: dbConfig.host,
        dialect: 'postgres',
        dialectModule: pg,
        port: dbConfig.port,
        pool: {
          max: isProduction ? 1 : 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        logging: false,
        retry: { max: 3 },
      }
    );
  }
  return sequelize;
}

function getModels() {
  if (!models) {
    const seq = getSequelize();
    
    // Import semua model
    const User = require('./user')(seq);
    const Pemasukan = require('./pemasukan')(seq);
    const Pengeluaran = require('./pengeluaran')(seq);
    const Hutang = require('./hutang')(seq);
    const NB = require('./nb')(seq);
    const RekapPemasukan = require('./rekappemasukan')(seq);
    const RekapPengeluaran = require('./rekappengeluaran')(seq);

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

    models = {
      sequelize: seq,
      User,
      Pemasukan,
      Pengeluaran,
      Hutang,
      NB,
      RekapPemasukan,
      RekapPengeluaran,
    };
  }
  return models;
}

const testConnection = async () => {
  const seq = getSequelize();
  return seq.authenticate();
};

module.exports = {
  get sequelize() { return getSequelize(); },
  get User() { return getModels().User; },
  get Pemasukan() { return getModels().Pemasukan; },
  get Pengeluaran() { return getModels().Pengeluaran; },
  get Hutang() { return getModels().Hutang; },
  get NB() { return getModels().NB; },
  get RekapPemasukan() { return getModels().RekapPemasukan; },
  get RekapPengeluaran() { return getModels().RekapPengeluaran; },
  testConnection,
};