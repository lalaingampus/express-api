const express = require('express');
const router = express.Router();
const rekapController = require('../controllers/rekapController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Rekap
 *   description: Rekap data bulanan pemasukan dan pengeluaran
 */
router.use(auth);

/**
 * @swagger
 * /rekap/move_pengeluaran:
 *   post:
 *     summary: Pindahkan data pengeluaran ke rekap bulanan
 *     tags: [Rekap]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Rekap pengeluaran berhasil diperbarui
 */
router.post('/move_pengeluaran', rekapController.movePengeluaranToRekap);

/**
 * @swagger
 * /rekap/move_pemasukan:
 *   post:
 *     summary: Pindahkan data pemasukan ke rekap bulanan
 *     tags: [Rekap]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Rekap pemasukan berhasil diperbarui
 */
router.post('/move_pemasukan', rekapController.movePemasukanToRekap);

/**
 * @swagger
 * /rekap/pengeluaran:
 *   get:
 *     summary: Ambil rekap pengeluaran bulanan
 *     tags: [Rekap]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Data rekap pengeluaran berhasil diambil
 */
router.get('/pengeluaran', rekapController.rekapPengeluaranList);

/**
 * @swagger
 * /rekap/pemasukan:
 *   get:
 *     summary: Ambil rekap pemasukan bulanan
 *     tags: [Rekap]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Data rekap pemasukan berhasil diambil
 */
router.get('/pemasukan', rekapController.rekapPemasukanList);

/**
 * @swagger
 * /rekap/transaksi_list_semua:
 *   get:
 *     summary: Ambil seluruh transaksi pemasukan dan pengeluaran gabungan
 *     tags: [Rekap]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Semua transaksi berhasil diambil
 */
router.get('/transaksi_list_semua', rekapController.transaksiListSemua);

module.exports = router;
