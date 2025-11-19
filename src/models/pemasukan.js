const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Pemasukan = sequelize.define(
    "Pemasukan",
    {
      selectedCategory: DataTypes.STRING, // SUmber pendapatan
      selectedStatus: DataTypes.STRING, // Marriage / Unmarriage
      selectedPerson: DataTypes.STRING, // Suami / Istri
      selectedItem: DataTypes.STRING,
      suami: { type: DataTypes.FLOAT, allowNull: true },
      istri: { type: DataTypes.FLOAT, allowNull: true },
      unMarried: { type: DataTypes.FLOAT, allowNull: true },
      total: { type: DataTypes.FLOAT, allowNull: true },
      keterangan: { type: DataTypes.TEXT },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_id", // 🧠 tambahkan ini supaya map ke kolom 'user_id' di DB
      },
    },
    {
      tableName: "data_pemasukan",
      timestamps: true,
    }
  );

  return Pemasukan;
};
