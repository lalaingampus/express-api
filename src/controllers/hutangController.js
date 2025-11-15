const { Hutang, Pengeluaran, Pemasukan } = require('../models');
const { sequelize } = require('../models');

exports.create = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { debtToPay, keterangan } = req.body;
    if (!debtToPay || !keterangan) {
      return res.status(400).json({ message: 'debtToPay dan keterangan wajib diisi.' });
    }

    const row = await Hutang.create({
      userId, debtToPay, keterangan, status: 'Belum Lunas'
    });

    res.status(201).json({
      message: 'Data hutang berhasil ditambahkan.',
      id: row.id,
      data: row,
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan data hutang.', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { debtToPay, keterangan } = req.body;

    if (!debtToPay || !keterangan) {
      return res.status(400).json({ message: 'debtToPay dan keterangan wajib diisi.' });
    }

    const row = await Hutang.findOne({ where: { id, userId } });
    if (!row) return res.status(404).json({ message: 'Data hutang tidak ditemukan.' });

    await row.update({
      debtToPay, keterangan, updatedAt: new Date().toISOString(),
      status: debtToPay === 0 ? 'Lunas' : row.status
    });

    res.json({ message: 'Data hutang berhasil diperbarui.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui data hutang.', error: error.message });
  }
};

exports.destroy = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const row = await Hutang.findOne({ where: { id, userId } });
    if (!row) return res.status(404).json({ message: 'Data hutang tidak ditemukan.' });

    await row.destroy();
    res.json({ message: 'Data hutang berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus data hutang.', error: error.message });
  }
};

exports.list = async (req, res) => {
  try {
    const userId = req.user.userId;
    const rows = await Hutang.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
    res.json({ message: 'Daftar data hutang berhasil diambil.', data: rows });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data hutang.', error: error.message });
  }
};

/**
 * Versi setara /calculate_hutang di Firebase:
 * mengurangi amount pengeluaran, dan memotong pemasukan (suami/istri) sebesar hutangBayar
 */
exports.calculateHutang = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.userId;
    const { hutangBayar, selectedHutang, selectedSumber } = req.body;

    if (!hutangBayar || !selectedHutang || !selectedSumber) {
      await t.rollback();
      return res.status(400).json({ message: 'hutangBayar, selectedHutang, selectedSumber wajib.' });
    }

    const pengeluaran = await Pengeluaran.findOne({ where: { id: selectedHutang, userId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!pengeluaran) {
      await t.rollback();
      return res.status(404).json({ message: 'Pengeluaran document not found' });
    }

    const pemasukan = await Pemasukan.findOne({ where: { id: selectedSumber, userId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!pemasukan) {
      await t.rollback();
      return res.status(404).json({ message: 'Pemasukan document not found' });
    }

    // validasi saldo pengeluaran
    if (pengeluaran.amount <= 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Saldo tidak cukup untuk membayar hutang (pengeluaran.amount <= 0)' });
    }

    const pay = parseFloat(hutangBayar);

    // potong dari suami/istri pemasukan
    let newSuami = pemasukan.suami;
    let newIstri = pemasukan.istri;

    if ((pemasukan.suami || 0) >= pay) {
      newSuami = (pemasukan.suami || 0) - pay;
    } else if ((pemasukan.istri || 0) >= pay) {
      newIstri = (pemasukan.istri || 0) - pay;
    } else {
      await t.rollback();
      return res.status(400).json({ message: 'Saldo suami atau istri tidak cukup' });
    }

    const newPengeluaranAmount = pengeluaran.amount - pay;
    await pengeluaran.update({ amount: newPengeluaranAmount }, { transaction: t });
    await pemasukan.update({ suami: newSuami, istri: newIstri }, { transaction: t });

    await t.commit();

    // response serupa: list pengeluaran kategori Hutang + list pemasukan user
    const pengeluaranList = await Pengeluaran.findAll({
      where: { userId, selectedCategory: 'Hutang' }, // NB: di Firebase ada "Hutang" / "Debt". Sesuaikan yang dipakai.
      order: [['createdAt', 'DESC']],
    });

    const pemasukanList = await Pemasukan.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });

    res.json({ pengeluaranList, pemasukanList });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error updating pengeluaran dan pemasukan', error: error.message });
  }
};
