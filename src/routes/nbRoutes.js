const express = require('express');
const router = express.Router();
const nbController = require('../controllers/nbController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: NB
 *   description: Catatan umum (notebook) pengguna
 */
router.use(auth);

/**
 * @swagger
 * /nb:
 *   get:
 *     summary: Ambil semua catatan NB
 *     tags: [NB]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Daftar catatan NB berhasil diambil
 */
router.get('/', nbController.list);

/**
 * @swagger
 * /nb:
 *   post:
 *     summary: Tambah catatan baru
 *     tags: [NB]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keterangan: { type: string }
 *     responses:
 *       201:
 *         description: Catatan berhasil ditambahkan
 */
router.post('/', nbController.create);

router.put('/:id', nbController.update);
router.delete('/:id', nbController.destroy);

module.exports = router;
