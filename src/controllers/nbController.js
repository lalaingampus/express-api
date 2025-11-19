const { NB } = require('../models');

exports.create = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { keterangan } = req.body;
    if (!keterangan) return res.status(400).json({ message: 'keterangan wajib diisi.' });

    const row = await NB.create({ userId, keterangan });
    res.status(201).json({
      message: 'Data nb berhasil ditambahkan.',
      id: row.id,
      data: row,
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan data nb.', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { keterangan } = req.body;

    if (!keterangan) return res.status(400).json({ message: 'keterangan wajib diisi.' });

    const row = await NB.findOne({ where: { id, userId } });
    if (!row) return res.status(404).json({ message: 'Data nb tidak ditemukan.' });

    await row.update({ keterangan, updatedAt: new Date().toISOString() });
    res.json({ message: 'Data nb berhasil diperbarui.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui data nb.', error: error.message });
  }
};

exports.destroy = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const row = await NB.findOne({ where: { id, userId } });
    if (!row) return res.status(404).json({ message: 'Data nb tidak ditemukan.' });

    await row.destroy();
    res.json({ message: 'Data nb berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus data nb.', error: error.message });
  }
};

exports.list = async (req, res) => {
  try {
    const userId = req.user.userId;
    const rows = await NB.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
    res.json({ message: 'Daftar data nb berhasil diambil.', data: rows });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data nb.', error: error.message });
  }
};
