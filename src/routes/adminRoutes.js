const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

router.get('/health', adminController.health);

router.get('/login', adminController.loginPage);

router.post('/login', adminController.login);

router.get('/verify', auth, adminController.verify);

router.get('/stats', auth, adminController.stats);

router.get('/users', auth, adminController.getAllUsersWithStats);

router.put('/users/:id', auth, adminController.updateUser);

router.delete('/users/:id', auth, adminController.deleteUser);

module.exports = router;