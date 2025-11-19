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
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "user_id", // follow your style
      },
    },
    {
      tableName: "cron_logs", // <-- follow convention
      timestamps: true,       // createdAt & updatedAt
    }
  );

  return CronLog;
};
