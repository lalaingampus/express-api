const express = require('express');
const router = express.Router();
const rekapController = require('../controllers/rekapController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Rekap
 *   description: Rekap data harian, mingguan, dan bulanan pemasukan & pengeluaran
 */

router.use(auth);

/**
 * @swagger
 * /rekap/move_pengeluaran:
 *   post:
 *     summary: Buat rekap pengeluaran. Sistem otomatis menentukan daily/weekly/monthly berdasarkan createdAt.
 *     tags: [Rekap]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rekap pengeluaran berhasil dibuat
 */
router.post('/move_pengeluaran', rekapController.movePengeluaranToRekap);

/**
 * @swagger
 * /rekap/move_pemasukan:
 *   post:
 *     summary: Buat rekap pemasukan. Sistem otomatis menentukan daily/weekly/monthly.
 *     tags: [Rekap]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rekap pemasukan berhasil dibuat
 */
router.post('/move_pemasukan', rekapController.movePemasukanToRekap);

/**
 * @swagger
 * /rekap/pengeluaran:
 *   get:
 *     summary: Ambil daftar rekap pengeluaran (daily, weekly, monthly, atau bulanan lama menggunakan bulan/tahun)
 *     tags: [Rekap]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *         description: Filter berdasarkan tipe rekap
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Tanggal mulai (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: Tanggal akhir (YYYY-MM-DD)
 *       - in: query
 *         name: bulan
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan bulan (mode lama)
 *       - in: query
 *         name: tahun
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan tahun (mode lama)
 *     responses:
 *       200:
 *         description: Data rekap pengeluaran berhasil diambil
 */
router.get('/pengeluaran', rekapController.rekapPengeluaranList);

/**
 * @swagger
 * /rekap/pemasukan:
 *   get:
 *     summary: Ambil daftar rekap pemasukan (daily, weekly, monthly, atau bulanan lama menggunakan bulan/tahun)
 *     tags: [Rekap]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *         description: Filter berdasarkan tipe rekap
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Tanggal mulai (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: Tanggal akhir (YYYY-MM-DD)
 *       - in: query
 *         name: bulan
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan bulan (mode lama)
 *       - in: query
 *         name: tahun
 *         schema:
 *           type: integer
 *         description: Filter berdasarkan tahun (mode lama)
 *     responses:
 *       200:
 *         description: Data rekap pemasukan berhasil diambil
 */
router.get('/pemasukan', rekapController.rekapPemasukanList);

/**
 * @swagger
 * /rekap/transaksi_list_semua:
 *   get:
 *     summary: Ambil seluruh transaksi pemasukan & pengeluaran dalam satu list
 *     tags: [Rekap]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Semua transaksi berhasil diambil
 */
router.get('/transaksi_list_semua', rekapController.transaksiListSemua);


module.exports = router;
