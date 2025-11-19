const cron = require("node-cron");
const moment = require("moment-timezone");

// === CONTROLLER ===
const {
  movePengeluaranToRekap,
  movePemasukanToRekap
} = require("./src/controllers/rekapController");

// === MODEL ===
const User = require("./src/models/user");
const CronLog = require("./src/models/cronlog");

// Set timezone Asia/Jakarta
moment.tz.setDefault("Asia/Jakarta");

console.log("🔥 CRON SERVICE STARTED (Asia/Jakarta)");

/* ============================================================
   HELPERS
   ============================================================ */
function fakeReq(userId) {
  return { user: { userId } };
}

function fakeRes() {
  return {
    status: () => ({ json: () => {} }),
    json: () => {}
  };
}

async function logCron(type, status, message, userId = null) {
  try {
    await CronLog.create({
      type,
      status,
      message,
      userId
    });
  } catch (err) {
    console.error("❌ Failed to write cron log:", err.message);
  }
}

/* ============================================================
   CORE EXECUTION LOGIC
   ============================================================ */
async function runRekap(type) {
  try {
    const users = await User.findAll({ where: { isActive: true } });

    for (const user of users) {
      const req = fakeReq(user.id);
      const res = fakeRes();

      try {
        await movePengeluaranToRekap(req, res);
        await movePemasukanToRekap(req, res);

        await logCron(type, "success", `Cron ${type} success`, user.id);

        console.log(`✔ CRON ${type.toUpperCase()} SUCCESS — USER ID: ${user.id}`);
      } catch (err) {
        await logCron(type, "failed", err.message, user.id);

        console.log(`❌ CRON ${type.toUpperCase()} FAILED — USER ID: ${user.id}`);
      }
    }
  } catch (err) {
    console.error("❌ Cron error:", err.message);
  }
}

/* ============================================================
   CRON SCHEDULES
   ============================================================ */

// === HARIAN → Jalan jam 23:59 setiap hari
cron.schedule("59 23 * * *", async () => {
  console.log("\n⏳ RUNNING DAILY CRON...");
  await runRekap("daily");
});

// === MINGGUAN → Jalan setiap hari Minggu 23:59
cron.schedule("59 23 * * 0", async () => {
  console.log("\n⏳ RUNNING WEEKLY CRON...");
  await runRekap("weekly");
});

// === BULANAN → Jalan setiap tanggal 1 jam 00:00
cron.schedule("0 0 1 * *", async () => {
  console.log("\n⏳ RUNNING MONTHLY CRON...");
  await runRekap("monthly");
});

module.exports = {};
