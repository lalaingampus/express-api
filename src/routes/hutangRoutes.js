const express = require('express');
const router = express.Router();
const hutangController = require('../controllers/hutangController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Hutang
 *   description: Manajemen hutang dan perhitungan pelunasan
 */
router.use(auth);

/**
 * @swagger
 * /hutang:
 *   get:
 *     summary: Ambil daftar semua hutang
 *     tags: [Hutang]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Daftar hutang berhasil diambil
 */
router.get('/', hutangController.list);

/**
 * @swagger
 * /hutang:
 *   post:
 *     summary: Tambah hutang baru
 *     tags: [Hutang]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               debtToPay: { type: number }
 *               keterangan: { type: string }
 *     responses:
 *       201:
 *         description: Hutang berhasil ditambahkan
 */
router.post('/', hutangController.create);

/**
 * @swagger
 * /hutang/calculate:
 *   post:
 *     summary: Kalkulasi sisa hutang atau pelunasan
 *     tags: [Hutang]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Perhitungan hutang berhasil dilakukan
 */
router.post('/calculate', hutangController.calculateHutang);


/**
 * @swagger
 * /hutang/{id}:
 *   put:
 *     summary: Update hutang berdasarkan ID
 *     tags: [Hutang]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               debtToPay: { type: number }
 *               keterangan: { type: string }
 *     responses:
 *       200:
 *         description: Hutang berhasil diperbarui
 */
router.put('/:id', hutangController.update);


/**
 * @swagger
 * /hutang/{id}:
 *   delete:
 *     summary: Hapus hutang berdasarkan ID
 *     tags: [Hutang]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Hutang berhasil dihapus
 */
router.delete('/:id', hutangController.destroy);

module.exports = router;
