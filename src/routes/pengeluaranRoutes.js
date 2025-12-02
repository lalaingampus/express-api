const express = require('express');
const router = express.Router();
const pengeluaranController = require('../controllers/pengeluaranController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Pengeluaran
 *   description: Manajemen data pengeluaran dan hutang
 */
router.use(auth);

/**
 * @swagger
 * /pengeluaran:
 *   get:
 *     summary: Ambil semua data pengeluaran
 *     tags: [Pengeluaran]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Daftar pengeluaran berhasil diambil
 */
router.get('/', pengeluaranController.list);

/**
 * @swagger
 * /pengeluaran:
 *   post:
 *     summary: Tambah data pengeluaran
 *     tags: [Pengeluaran]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               selectedCategory: { type: string }
 *               amount: { type: number }
 *               selectedSumber: { type: number }
 *               keterangan: { type: string }
 *     responses:
 *       201:
 *         description: Pengeluaran berhasil ditambahkan
 */
router.post('/', pengeluaranController.create);

/**
 * @swagger
 * /pengeluaran/{id}:
 *   put:
 *     summary: Update data pengeluaran berdasarkan ID
 *     tags: [Pengeluaran]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pengeluaran yang ingin diupdate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               selectedSumber:
 *                 type: number
 *               keterangan:
 *                 type: string
 *               createdAt:                 # ⬅⬅⬅ TAMBAH INI
 *                 type: string
 *                 format: date-time
 *                 example: "2025-12-01T04:31:00.000Z"
 *     responses:
 *       200:
 *         description: Pengeluaran berhasil diupdate
 *       404:
 *         description: Data tidak ditemukan
 */
router.put('/:id', pengeluaranController.update);

/**
 * @swagger
 * /pengeluaran/{id}:
 *   get:
 *     summary: Ambil detail pengeluaran berdasarkan ID
 *     tags: [Pengeluaran]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: 
 *           type: integer
 *         description: ID data pengeluaran yang ingin diambil
 *     responses:
 *       200:
 *         description: Detail pengeluaran
 */
router.get('/:id', pengeluaranController.getById);


/**
 * @swagger
 * /pengeluaran/{id}:
 *   delete:
 *     summary: Hapus data pengeluaran berdasarkan ID
 *     tags: [Pengeluaran]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID pengeluaran yang ingin dihapus
 *     responses:
 *       200:
 *         description: Pengeluaran berhasil dihapus
 *       404:
 *         description: Data tidak ditemukan
 */
router.delete('/:id', pengeluaranController.destroy);

/**
 * @swagger
 * /pengeluaran/list/debt:
 *   get:
 *     summary: Ambil daftar kategori hutang
 *     tags: [Pengeluaran]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Daftar kategori hutang berhasil diambil
 */
router.get('/list/debt', pengeluaranController.listDebtCategory);

/**
 * @swagger
 * /pengeluaran/list/by-sumber/{role}:
 *   get:
 *     summary: Ambil pengeluaran berdasarkan sumber (Husband/Wife)
 *     tags: [Pengeluaran]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Husband, Wife]
 *     responses:
 *       200:
 *         description: Daftar pengeluaran berhasil diambil
 */
router.get('/list/by-sumber/:role(Husband|Wife)', pengeluaranController.listBySumberPerson);

module.exports = router;
