const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Hutang = sequelize.define('Hutang', {
    debtToPay: { type: DataTypes.FLOAT, allowNull: false },
    keterangan: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM('Belum Lunas', 'Lunas'),
      defaultValue: 'Belum Lunas',
    },
    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      field: 'user_id',   // 🧠 tambahkan ini supaya map ke kolom 'user_id' di DB
    },
  }, {
    tableName: 'data_hutang',
    timestamps: true,
  });

  return Hutang;
};
