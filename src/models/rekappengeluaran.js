const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RekapPengeluaran = sequelize.define('RekapPengeluaran', {
    totalPengeluaran: { 
      type: DataTypes.FLOAT, 
      allowNull: false, 
      defaultValue: 0 
    },

    type: { 
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      allowNull: false,
    },

    startDate: { 
      type: DataTypes.DATEONLY, 
      allowNull: false 
    },

    endDate: { 
      type: DataTypes.DATEONLY, 
      allowNull: false 
    },

    /* Tambahkan ini */
    month: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

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
    tableName: 'rekap_data_pengeluaran',
    timestamps: true,
  });

  return RekapPengeluaran;
};
