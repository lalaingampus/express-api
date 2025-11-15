const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RekapPengeluaran = sequelize.define('RekapPengeluaran', {
    totalPengeluaran: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    month: { type: DataTypes.INTEGER, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    data: { type: DataTypes.JSONB },
    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      field: 'user_id',   // 🧠 tambahkan ini supaya map ke kolom 'user_id' di DB
    },
  }, {
    tableName: 'rekap_data_pengeluaran',
    timestamps: true,
  });

  return RekapPengeluaran;
};
