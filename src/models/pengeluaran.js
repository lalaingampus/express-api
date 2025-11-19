const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Pengeluaran = sequelize.define(
    "Pengeluaran",
    {
      selectedCategory: DataTypes.STRING,
      selectedSumber: { type: DataTypes.INTEGER, allowNull: true }, // FK ke Pemasukan.id
      selectedDebt: { type: DataTypes.INTEGER, allowNull: true }, // FK ke Hutang.id
      amount: { type: DataTypes.FLOAT, allowNull: false },
      keterangan: DataTypes.TEXT,
      paidFrom: {
        type: DataTypes.STRING,
        allowNull: true, // 'suami' atau 'istri'
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_id", // 🧠 tambahkan ini supaya map ke kolom 'user_id' di DB
      },
    },
    {
      tableName: "data_pengeluaran",
      timestamps: true,
    }
  );

  return Pengeluaran;
};
