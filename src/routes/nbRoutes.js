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
 *     security:
 *       - bearerAuth: []
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
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - keterangan
 *             properties:
 *               keterangan:
 *                 type: string
 *                 example: "Catatan harian penting"
 *     responses:
 *       201:
 *         description: Catatan berhasil ditambahkan
 */
router.post('/', nbController.create);

/**
 * @swagger
 * /nb/{id}:
 *   put:
 *     summary: Update catatan NB berdasarkan ID
 *     tags: [NB]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID catatan NB
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               keterangan:
 *                 type: string
 *                 example: "Catatan sudah diupdate"
 *     responses:
 *       200:
 *         description: Catatan berhasil diupdate
 *       404:
 *         description: Catatan tidak ditemukan
 */
router.put('/:id', nbController.update);

/**
 * @swagger
 * /nb/{id}:
 *   delete:
 *     summary: Hapus catatan berdasarkan ID
 *     tags: [NB]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID catatan NB
 *     responses:
 *       200:
 *         description: Catatan berhasil dihapus
 *       404:
 *         description: Catatan tidak ditemukan
 */
router.delete('/:id', nbController.destroy);

module.exports = router;
