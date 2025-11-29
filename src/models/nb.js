const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const NB = sequelize.define(
    "NB",
    {
      keterangan: { type: DataTypes.TEXT, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "data_nb",
      timestamps: true,
    }
  );

  return NB;
};
