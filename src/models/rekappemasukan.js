const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RekapPemasukan = sequelize.define('RekapPemasukan', {
    totalPemasukan: { 
      type: DataTypes.FLOAT, 
      allowNull: false, 
      defaultValue: 0 
    },

    // DAILY / WEEKLY / MONTHLY
    type: { 
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      allowNull: false,
    },

    // start-end date untuk periode laporan
    startDate: { 
      type: DataTypes.DATEONLY, 
      allowNull: false 
    },

    endDate: { 
      type: DataTypes.DATEONLY, 
      allowNull: false 
    },

    month: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // JSON untuk simpan list item transaksi
    data: { 
      type: DataTypes.JSONB, 
      allowNull: true 
    },

    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      field: 'user_id',
    },
  }, {
    tableName: 'rekap_data_pemasukan',
    timestamps: true,
  });

  return RekapPemasukan;
};
