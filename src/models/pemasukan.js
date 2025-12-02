const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Pemasukan = sequelize.define(
    "Pemasukan",
    {
      selectedCategory: DataTypes.STRING,
      selectedStatus: DataTypes.STRING,
      selectedPerson: DataTypes.STRING,
      selectedItem: DataTypes.STRING,

      suami: DataTypes.FLOAT,
      istri: DataTypes.FLOAT,
      unMarried: DataTypes.FLOAT,
      total: DataTypes.FLOAT,

      keterangan: DataTypes.TEXT,

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_id",
      },

      // ⬇⬇ FIX PALING PENTING ⬇⬇
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "createdAt",
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "updatedAt",
      },
    },
    {
      tableName: "data_pemasukan",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  return Pemasukan;
};
