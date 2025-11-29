const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Hutang = sequelize.define(
    "Hutang",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_id",
      },

      debtToPay: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      keterangan: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM("Belum Lunas", "Lunas"),
        defaultValue: "Belum Lunas",
      },
    },
    {
      tableName: "hutang",
      timestamps: true, // createdAt & updatedAt aktif
    }
  );

  return Hutang;
};
