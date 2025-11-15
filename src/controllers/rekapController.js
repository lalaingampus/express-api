const { Sequelize } = require('sequelize');
const { sequelize, Pengeluaran, Pemasukan, RekapPengeluaran, RekapPemasukan } = require('../models');

exports.movePengeluaranToRekap = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.userId;

    const rows = await Pengeluaran.findAll({ where: { userId }, transaction: t });
    if (!rows.length) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'No pengeluaran data found for this user.' });
    }

    const total = rows.reduce((acc, r) => acc + (r.amount || 0), 0);
    const data = rows.map(r => r.toJSON());

    const now = new Date();
    const payload = {
      userId,
      totalPengeluaran: total,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      data,
      createdAt: now,
      updatedAt: now,
    };

    const rekap = await RekapPengeluaran.create(payload, { transaction: t });

    await t.commit();
    res.json({
      success: true,
      message: 'Data successfully copied to rekap_data_pengeluaran.',
      rekapId: rekap.id,
      total,
      jumlahData: data.length,
      dataPreview: data.slice(0, 3),
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ success: false, message: 'Error moving data.', error: error.message });
  }
};

exports.movePemasukanToRekap = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.userId;

    const rows = await Pemasukan.findAll({ where: { userId }, transaction: t });
    if (!rows.length) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'No pemasukan data found for this user.' });
    }

    // versi Firestore kamu jumlahkan `data.amount`, tapi di model pemasukan kita tidak punya field `amount`.
    // Bila ingin total pemasukan, bisa gunakan (suami || 0) + (istri || 0) atau gunakan `total` bila diisi.
    const total = rows.reduce((acc, r) => acc + (r.total || 0), 0);
    const data = rows.map(r => r.toJSON());

    const now = new Date();
    const payload = {
      userId,
      totalPemasukan: total,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      data,
      createdAt: now,
      updatedAt: now,
    };

    const rekap = await RekapPemasukan.create(payload, { transaction: t });

    await t.commit();
    res.json({
      success: true,
      message: 'Data successfully copied to rekap_data_pemasukan.',
      rekapId: rekap.id,
      total,
      jumlahData: data.length,
      dataPreview: data.slice(0, 3),
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ success: false, message: 'Error moving data.', error: error.message });
  }
};

exports.rekapPengeluaranList = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bulan, tahun } = req.query;

    const where = { userId };
    if (bulan && tahun) {
      where.month = parseInt(bulan, 10);
      where.year = parseInt(tahun, 10);
    }

    const rows = await RekapPengeluaran.findAll({ where, order: [['createdAt', 'DESC']] });
    if (!rows.length) return res.status(404).json({ message: 'Data pengeluaran tidak ditemukan untuk filter ini.' });

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error getting pengeluaran', error: error.message });
  }
};

exports.rekapPemasukanList = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bulan, tahun } = req.query;

    const where = { userId };
    if (bulan && tahun) {
      where.month = parseInt(bulan, 10);
      where.year = parseInt(tahun, 10);
    }

    const rows = await RekapPemasukan.findAll({ where, order: [['createdAt', 'DESC']] });
    if (!rows.length) return res.status(404).json({ message: 'Data pemasukan tidak ditemukan untuk filter ini.' });

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
