const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../services/firebase');

const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res) => {
  const { username, password } = req.body;

  const snapshot = await db.collection('users').where('username', '==', username).get();
  if (snapshot.empty) return res.status(401).send('Username or password incorrect');

  const user = snapshot.docs[0].data();
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).send('Username or password incorrect');

  const token = jwt.sign(
    { userId: snapshot.docs[0].id, username },
    JWT_SECRET,
    { expiresIn: '5h' }
  );

  res.json({ token });
};
