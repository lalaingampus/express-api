// src/models/CronLog.js

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

const CronLog = sequelize.define("CronLog", {
  type: {
    type: DataTypes.STRING,
    allowNull: false, // daily, weekly, monthly
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "success", // success / failed
  },
  message: {
    type: DataTypes.TEXT,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }
}, {
  tableName: "cron_logs",
});

module.exports = CronLog;
