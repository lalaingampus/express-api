const cron = require("node-cron");
const { movePengeluaranToRekap, movePemasukanToRekap } = require("./src/controllers/rekapController");

// Utility untuk membuat req/res palsu
function fakeReq(userId) {
  return {
    user: { userId }
  };
}

function fakeRes() {
  return {
    status: () => ({ json: () => {} }),
    json: () => {},
  };
}

console.log("Cron service started...");

// === CRON BULANAN ===
// Jalan tiap tanggal 1 jam 00:00
cron.schedule("0 0 1 * *", async () => {
  console.log("Running monthly recap creation...");

  try {
    const req = fakeReq(1);       // userId default = 1 (atau looping semua user)
    const res = fakeRes();

    await movePengeluaranToRekap(req, res);
    await movePemasukanToRekap(req, res);

    console.log("Monthly rekap generated successfully.");
  } catch (error) {
    console.error("Cron error:", error.message);
  }
});
