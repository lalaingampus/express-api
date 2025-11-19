const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const exists = await User.findOne({ where: { username } });
    if (exists) return res.status(400).json({ message: 'Username already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });

    const token = jwt.sign(
      { userId: user.id, username },
      process.env.JWT_SECRET,
      { expiresIn: '5h' }
    );

    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Internal error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Username or password incorrect' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, createdAt: new Date().toISOString() },
      process.env.JWT_SECRET,
      { expiresIn: '5h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Internal error', error: error.message });
  }
};

exports.users = async (_req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'username', 'email', 'createdAt'] });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error getting users', error: error.message });
  }
};

exports.me = async (req, res) => {
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

    res.json({ message: 'Token valid', user });
  } catch (error) {
    res.status(401).json({ message: 'Token tidak valid', error: error.message });
  }
};
