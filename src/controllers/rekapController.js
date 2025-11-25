const { Sequelize, Op } = require("sequelize");
const {
  sequelize,
  Pengeluaran,
  Pemasukan
} = require("../models");


// ===================================================
// HELPER RANGE TANGGAL (WIB +07:00)
// ===================================================
function getDailyRange(startDate, endDate) {
  return {
    start: new Date(`${startDate}T00:00:00+07:00`),
    end: new Date(`${endDate}T23:59:59+07:00`)
  };
}

function getWeeklyRange() {
  const now = new Date();

  // konversi ke WIB
  const wibNow = new Date(now.getTime() + 7 * 3600 * 1000);

  const end = new Date(
    `${wibNow.getFullYear()}-${String(wibNow.getMonth() + 1).padStart(2,"0")}-${String(wibNow.getDate()).padStart(2,"0")}T23:59:59+07:00`
  );

  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0,0,0,0);

  return { start, end };
}

function getMonthlyRange(bulan, tahun) {
  const month = parseInt(bulan, 10);
  const year = parseInt(tahun, 10);

  const start = new Date(`${year}-${String(month).padStart(2,"0")}-01T00:00:00+07:00`);

  const end = new Date(start);
  end.setMonth(start.getMonth() + 1);
  end.setSeconds(end.getSeconds() - 1);

  return { start, end };
}



// ===================================================
// REKAP PEMASUKAN REALTIME (DAILY, WEEKLY, MONTHLY)
// ===================================================
exports.rekapPemasukanList = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, startDate, endDate, bulan, tahun } = req.query;

    let start, end;

    if (type === "daily") {
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate & endDate wajib untuk daily" });
      }
      ({ start, end } = getDailyRange(startDate, endDate));
    }

    else if (type === "weekly") {
      ({ start, end } = getWeeklyRange());
    }

    else if (type === "monthly") {
      if (!bulan || !tahun) {
        return res.status(400).json({ message: "bulan & tahun wajib untuk monthly" });
      }
      ({ start, end } = getMonthlyRange(bulan, tahun));
    }

    else {
      return res.status(400).json({ message: "type harus daily | weekly | monthly" });
    }

    const pemasukanRows = await Pemasukan.findAll({
      where: {
        userId,
        createdAt: { [Op.between]: [start, end] }
      },
      order: [["createdAt", "DESC"]]
    });

    const totalPemasukan = pemasukanRows.reduce(
      (sum, r) => sum + (r.total || 0),
      0
    );

    res.json({
      type,
      startDate: start,
      endDate: end,
      totalPemasukan,
      data: pemasukanRows
    });

  } catch (error) {
    res.status(500).json({
      message: "Error realtime rekap pemasukan",
      error: error.message,
    });
  }
};




// ===================================================
// REKAP PENGELUARAN REALTIME (DAILY, WEEKLY, MONTHLY)
// ===================================================
exports.rekapPengeluaranList = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, startDate, endDate, bulan, tahun } = req.query;

    let start, end;

    if (type === "daily") {
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate & endDate wajib untuk daily" });
      }
      ({ start, end } = getDailyRange(startDate, endDate));
    }

    else if (type === "weekly") {
      ({ start, end } = getWeeklyRange());
    }

    else if (type === "monthly") {
      if (!bulan || !tahun) {
        return res.status(400).json({ message: "bulan & tahun wajib untuk monthly" });
      }
      ({ start, end } = getMonthlyRange(bulan, tahun));
    }

    else {
      return res.status(400).json({ message: "type harus daily | weekly | monthly" });
    }

    const pengeluaranRows = await Pengeluaran.findAll({
      where: {
        userId,
        createdAt: { [Op.between]: [start, end] }
      },
      order: [["createdAt", "DESC"]]
    });

    const totalPengeluaran = pengeluaranRows.reduce(
      (sum, r) => sum + (r.amount || 0),
      0
    );

    res.json({
      type,
      startDate: start,
      endDate: end,
      totalPengeluaran,
      data: pengeluaranRows
    });

  } catch (error) {
    res.status(500).json({
      message: "Error realtime rekap pengeluaran",
      error: error.message,
    });
  }
};




// =======================================================
// GABUNGAN TRANSAKSI (TANPA PERUBAHAN)
// =======================================================
exports.transaksiListSemua = async (req, res) => {
  try {
    const userId = req.user.userId;

    const pemasukanIstriList = await Pemasukan.findAll({
      where: { suami: { [Sequelize.Op.is]: null }, userId },
    });
    if (!pemasukanIstriList.length)
      return res.status(404).json({
        message: "No pemasukan data found for Istri",
      });

    const pemasukanSuamiList = await Pemasukan.findAll({
      where: { istri: { [Sequelize.Op.is]: null }, userId },
    });
    if (!pemasukanSuamiList.length)
      return res.status(404).json({
        message: "No pemasukan data found for Suami",
      });

    const pemasukanIstriId = pemasukanIstriList[0].id;
    const pemasukanSuamiId = pemasukanSuamiList[0].id;

    const pengeluaranIstriList = await Pengeluaran.findAll({
      where: { userId, selectedSumber: pemasukanIstriId },
    });

    const pengeluaranSuamiList = await Pengeluaran.findAll({
      where: { userId, selectedSumber: pemasukanSuamiId },
    });

    const combined = [
      ...pemasukanIstriList.map((r) => ({
        ...r.toJSON(),
        __type: "pemasukan_istri",
      })),
      ...pemasukanSuamiList.map((r) => ({
        ...r.toJSON(),
        __type: "pemasukan_suami",
      })),
      ...pengeluaranIstriList.map((r) => ({
        ...r.toJSON(),
        __type: "pengeluaran_istri",
      })),
      ...pengeluaranSuamiList.map((r) => ({
        ...r.toJSON(),
        __type: "pengeluaran_suami",
      })),
    ];

    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(combined);
  } catch (error) {
    res.status(500).json({
      message: "Error getting transaksi list",
      error: error.message,
    });
  }
};
