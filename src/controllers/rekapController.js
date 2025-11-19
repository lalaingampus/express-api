const { Sequelize } = require('sequelize');
const { sequelize, Pengeluaran, Pemasukan, RekapPengeluaran, RekapPemasukan } = require('../models');
const {
  getDailyRange,
  getWeeklyRange,
  getMonthlyRange
} = require('../utils/dateRange');

exports.movePengeluaranToRekap = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user.userId;

    // AMBIL SEMUA DATA USER
    const rows = await Pengeluaran.findAll({ where: { userId }, transaction: t });
    if (!rows.length) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'No pengeluaran data found.' });
    }

    // GUNAKAN CREATED AT TERBARU
    const dates = rows.map(r => new Date(r.createdAt));
    const latestDate = new Date(Math.max(...dates));

    const today = new Date();
    const diffDays = (today - latestDate) / (1000 * 60 * 60 * 24);

    let type = "monthly";
    let startDate, endDate;

    // === AUTO DETECT TYPE ===
    if (latestDate.toDateString() === today.toDateString()) {
      type = "daily";
    } 
    else if (diffDays <= 7) {
      type = "weekly";
    } 
    else {
      type = "monthly";
    }

    // === HITUNG RANGE ===
    endDate = today.toISOString().slice(0, 10);

    if (type === "daily") {
      startDate = today.toISOString().slice(0, 10);
    } 
    else if (type === "weekly") {
      const day = today.getDay(); // 0 = Sunday
      const monday = new Date(today);
      monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));

      startDate = monday.toISOString().slice(0, 10);
    } 
    else {
      // MONTHLY
      startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    }

    // === TOTAL DAN DATA ===
    const total = rows.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    const data = rows.map(r => r.toJSON());

    // === PAYLOAD ===
    const payload = {
      userId,
      type,
      startDate,
      endDate,
      totalPengeluaran: total,
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      data
    };

    // SIMPAN REKAP
    const rekap = await RekapPengeluaran.create(payload, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: `Rekap pengeluaran otomatis (${type}) berhasil.`,
      rekap
    });

  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error moving data.', error: error.message });
  }
};



exports.movePemasukanToRekap = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user.userId;

    // AMBIL SEMUA PEMASUKAN USER
    const rows = await Pemasukan.findAll({ where: { userId }, transaction: t });

    if (!rows.length) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'No pemasukan data found.'
      });
    }

    // GUNAKAN CREATED AT TERBARU
    const dates = rows.map(r => new Date(r.createdAt));
    const latestDate = new Date(Math.max(...dates));

    const today = new Date();
    const diffDays = (today - latestDate) / (1000 * 60 * 60 * 24);

    let type = "monthly";

    // === AUTO DETECT ===
    if (latestDate.toDateString() === today.toDateString()) {
      type = "daily";
    }
    else if (diffDays <= 7) {
      type = "weekly";
    }
    else {
      type = "monthly";
    }

    // === HITUNG RANGE ===
    let startDate;
    const endDate = today.toISOString().slice(0, 10); // YYYY-MM-DD

    if (type === "daily") {
      startDate = today.toISOString().slice(0, 10);
    } 
    else if (type === "weekly") {
      const day = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1)); // Kalau hari minggu

      startDate = monday.toISOString().slice(0, 10);
    } 
    else {
      // MONTHLY
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
    }

    // === TOTAL PEMASUKAN ===
    // total = total (kalau suami/istri null tetap 0)
    const total = rows.reduce(
      (acc, r) => acc + Number(r.total || 0),
      0
    );

    const data = rows.map(r => r.toJSON());

    // === PAYLOAD ===
    const payload = {
      userId,
      type,
      startDate,
      endDate,
      totalPemasukan: total,
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      data,
    };

    // SIMPAN REKAP
    const rekap = await RekapPemasukan.create(payload, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: `Rekap pemasukan otomatis (${type}) berhasil.`,
      rekap
    });

  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: 'Error moving pemasukan data.',
      error: error.message
    });
  }
};




exports.rekapPengeluaranList = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, startDate, endDate, bulan, tahun } = req.query;

    let where = { userId };

    // FILTER TYPE (harus strict)
    if (type) {
      where.type = type;
    }

    // FILTER DATE RANGE
    if (startDate && endDate) {
      where.startDate = startDate;
      where.endDate = endDate;
    }

    // FILTER fallback monthly lama
    if (bulan && tahun) {
      where.month = parseInt(bulan, 10);
      where.year = parseInt(tahun, 10);
    }

    const rows = await RekapPengeluaran.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    // Kalau type ada tapi data tidak ada → return 404
    if (type && !rows.length) {
      return res.status(404).json({
        message: `Tidak ada rekap pengeluaran untuk type '${type}'`
      });
    }

    res.json(rows);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




exports.rekapPemasukanList = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { type, startDate, endDate, bulan, tahun } = req.query;

    let where = { userId };

    // STRICT FILTER BY TYPE
    if (type) {
      where.type = type;
    }

    // DATE RANGE FILTER (opsional)
    if (startDate && endDate) {
      where.startDate = startDate;
      where.endDate = endDate;
    }

    // FALLBACK MONTHLY FILTER (sistem lama)
    if (bulan && tahun) {
      where.month = parseInt(bulan, 10);
      where.year = parseInt(tahun, 10);
    }

    const rows = await RekapPemasukan.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    // JIKA TYPE ADA TAPI DATA TIDAK ADA
    if (type && !rows.length) {
      return res.status(404).json({
        message: `Tidak ada rekap pemasukan untuk type '${type}'`
      });
    }

    res.json(rows);

  } catch (error) {
    res.status(500).json({ message: 'Error getting pemasukan', error: error.message });
  }
};





/**
 * Versi /transaksi_list_semua (gabung pemasukan suami/istri & pengeluaran masing²)
 * Mengikuti pola lama:
 * - Istri: pemasukan dengan suami == null
 * - Suami: pemasukan dengan istri == null
 */
exports.transaksiListSemua = async (req, res) => {
  try {
    const userId = req.user.userId;

    const pemasukanIstriList = await Pemasukan.findAll({
      where: { suami: { [Sequelize.Op.is]: null }, userId },
    });
    if (!pemasukanIstriList.length) return res.status(404).json({ message: 'No pemasukan data found for Istri' });
    const pemasukanIstriId = pemasukanIstriList[0].id;

    const pemasukanSuamiList = await Pemasukan.findAll({
      where: { istri: { [Sequelize.Op.is]: null }, userId },
    });
    if (!pemasukanSuamiList.length) return res.status(404).json({ message: 'No pemasukan data found for Suami' });
    const pemasukanSuamiId = pemasukanSuamiList[0].id;

    const pengeluaranIstriList = await Pengeluaran.findAll({
      where: { userId, selectedSumber: pemasukanIstriId },
    });

    const pengeluaranSuamiList = await Pengeluaran.findAll({
      where: { userId, selectedSumber: pemasukanSuamiId },
    });

    const combined = [
      ...pemasukanIstriList.map(r => ({ ...r.toJSON(), __type: 'pemasukan_istri' })),
      ...pemasukanSuamiList.map(r => ({ ...r.toJSON(), __type: 'pemasukan_suami' })),
      ...pengeluaranIstriList.map(r => ({ ...r.toJSON(), __type: 'pengeluaran_istri' })),
      ...pengeluaranSuamiList.map(r => ({ ...r.toJSON(), __type: 'pengeluaran_suami' })),
    ];

    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(combined);
  } catch (error) {
    res.status(500).json({ message: 'Error getting transaksi list', error: error.message });
  }
};
