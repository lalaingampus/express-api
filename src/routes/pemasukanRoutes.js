const express = require("express");
const router = express.Router();
const pemasukanController = require("../controllers/pemasukanController");
const auth = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Pemasukan
 *   description: Manajemen data pemasukan (suami/istri)
 */
router.use(auth);

/**
 * @swagger
 * /pemasukan:
 *   get:
 *     summary: Ambil semua data pemasukan user
 *     tags: [Pemasukan]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Daftar pemasukan berhasil diambil
 */
router.get("/", pemasukanController.listByUser);

/**
 * @swagger
 * /pemasukan:
 *   post:
 *     summary: Tambah pemasukan baru
 *     tags: [Pemasukan]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               selectedCategory: { type: string }
 *               selectedPerson: { type: string }
 *               selectedItem: { type: string }
 *               selectedStatus: { type: string }
 *               suami: { type: number }
 *               istri: { type: number }
 *               unMarried: { type: number }
 *               total: { type: number }
 *               keterangan: { type: string }
 *     responses:
 *       201:
 *         description: Data pemasukan berhasil ditambahkan
 */
router.post("/", pemasukanController.create);

/**
 * @swagger
 * /pemasukan/{id}:
 *   get:
 *     summary: Ambil detail pemasukan berdasarkan ID
 *     tags: [Pemasukan]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Data ditemukan }
 */
router.get("/:id", pemasukanController.getById);

/**
 * @swagger
 * /pemasukan/{id}:
 *   put:
 *     summary: Update data pemasukan
 *     tags: [Pemasukan]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               selectedCategory: { type: string }
 *               selectedPerson: { type: string }
 *               selectedItem: { type: string }
 *               selectedStatus: { type: string }
 *               suami: { type: number }
 *               istri: { type: number }
 *               unMarried: { type: number }
 *               total: { type: number }
 *               keterangan: { type: string }
 *               createdAt: { type: string, format: "date-time" }
 *     responses:
 *       200:
 *         description: Data berhasil diperbarui
 */
router.put("/:id", pemasukanController.update);

/**
 * @swagger
 * /pemasukan/{id}:
 *   delete:
 *     summary: Hapus data pemasukan
 *     tags: [Pemasukan]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Data berhasil dihapus }
 */
router.delete("/:id", pemasukanController.destroy);

module.exports = router;
