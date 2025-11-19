// src/models/CronLog.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CronLog = sequelize.define(
    "CronLog",
    {
      type: {
        type: DataTypes.ENUM("daily", "weekly", "monthly"),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("success", "failed"),
        allowNull: false,
        defaultValue: "success",
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "user_id",
      },
    },
    {
      tableName: "cron_logs",
      timestamps: true,
      underscored: true, // optional kalau kamu pakai snake_case
    }
  );

  return CronLog;
};
