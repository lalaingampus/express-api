const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.loginPage = (req, res) => {
  res.sendFile('login.html', { root: 'public/admin' });
};

exports.dashboardPage = (req, res) => {
  res.sendFile('dashboard.html', { root: 'public/admin' });
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Error server', error: error.message });
  }
};

exports.verify = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'username', 'email', 'createdAt'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json({ valid: true, user });
  } catch (error) {
    res.status(401).json({ message: 'Token tidak valid', error: error.message });
  }
};

exports.stats = async (req, res) => {
  try {
    const { Pemasukan, Pengeluaran, Hutang, NB } = require('../models');
    
    const [pemasukanSum, pengeluaranSum, hutangSum, nbRecords] = await Promise.all([
      Pemasukan.sum('total'),
      Pengeluaran.sum('amount'),
      Hutang.sum('debtToPay'),
      NB.count(),
    ]);

    res.json({
      pemasukan: pemasukanSum || 0,
      pengeluaran: pengeluaranSum || 0,
      hutang: hutangSum || 0,
      nbCount: nbRecords,
      saldo: (pemasukanSum || 0) - (pengeluaranSum || 0),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error getting stats', error: error.message });
  }
};

exports.getAllUsersWithStats = async (req, res) => {
  try {
    const { User, Pemasukan, Pengeluaran, Hutang } = require('../models');
    const { sequelize } = require('../models');

    const users = await User.findAll({
      attributes: [
        'id',
        'username',
        'email',
        'createdAt',
        [
          sequelize.literal(`(
            SELECT COALESCE(SUM("total"), 0)
            FROM "data_pemasukan"
            WHERE "user_id" = "User"."id"
          )`),
          'pemasukan'
        ],
        [
          sequelize.literal(`(
            SELECT COALESCE(SUM("amount"), 0)
            FROM "data_pengeluaran"
            WHERE "user_id" = "User"."id"
          )`),
          'pengeluaran'
        ],
        [
          sequelize.literal(`(
            SELECT COALESCE(SUM("debtToPay"), 0)
            FROM "hutang"
            WHERE "user_id" = "User"."id"
          )`),
          'hutang'
        ]
      ],
      order: [['createdAt', 'DESC']],
      raw: true,
    });

    const usersWithStats = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      pemasukan: parseFloat(user.pemasukan) || 0,
      pengeluaran: parseFloat(user.pengeluaran) || 0,
      hutang: parseFloat(user.hutang) || 0,
      saldo: (parseFloat(user.pemasukan) || 0) - (parseFloat(user.pengeluaran) || 0),
    }));

    res.json({ users: usersWithStats });
  } catch (error) {
    res.status(500).json({ message: 'Error getting users', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    if (username && username !== user.username) {
      const exists = await User.findOne({ where: { username } });
      if (exists) {
        return res.status(400).json({ message: 'Username sudah digunakan' });
      }
      user.username = username;
    }

    if (email) user.email = email;

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
    }

    await user.save();

    res.json({
      message: 'User berhasil diupdate',
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    await user.destroy();

    res.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};