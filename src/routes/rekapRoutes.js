const express = require('express');
const router = express.Router();
const rekapController = require('../controllers/rekapController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Rekap
 *   description: Rekap Statistik Harian, Mingguan, Bulanan
 */

router.use(auth);


//
// =========================
// LIST REKAP PENGELUARAN
// =========================
//

/**
 * @swagger
 * /rekap/pengeluaran:
 *   get:
 *     tags: [Rekap]
 *     summary: Ambil rekap pengeluaran berdasarkan type (daily, weekly, monthly)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *         description: Jenis rekap (daily / weekly / monthly)
 *
 *       # ==== DAILY ====
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: |
 *           Format: YYYY-MM-DD  
 *           Wajib jika type = daily
 *
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: |
 *           Format: YYYY-MM-DD  
 *           Wajib jika type = daily
 *
 *       # ==== MONTHLY ====
 *       - in: query
 *         name: bulan
 *         schema:
 *           type: integer
 *         description: |
 *           Bulan (1-12).  
 *           Wajib jika type = monthly.
 *
 *       - in: query
 *         name: tahun
 *         schema:
 *           type: integer
 *         description: |
 *           Tahun lengkap (misal 2025).  
 *           Wajib jika type = monthly.
 *
 *     responses:
 *       200:
 *         description: Rekap pengeluaran
 */
router.get('/pengeluaran', rekapController.rekapPengeluaranList);


//
// =========================
// LIST REKAP PEMASUKAN
// =========================
//

/**
 * @swagger
 * /rekap/pemasukan:
 *   get:
 *     tags: [Rekap]
 *     summary: Ambil rekap pemasukan berdasarkan type (daily, weekly, monthly)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *         description: Jenis rekap (daily / weekly / monthly)
 *
 *       # ==== DAILY ====
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: |
 *           Format: YYYY-MM-DD  
 *           Wajib jika type = daily
 *
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: |
 *           Format: YYYY-MM-DD  
 *           Wajib jika type = daily
 *
 *       # ==== MONTHLY ====
 *       - in: query
 *         name: bulan
 *         schema:
 *           type: integer
 *         description: |
 *           Bulan (1-12).  
 *           Wajib jika type = monthly.
 *
 *       - in: query
 *         name: tahun
 *         schema:
 *           type: integer
 *         description: |
 *           Tahun lengkap (misal 2025).  
 *           Wajib jika type = monthly.
 *
 *     responses:
 *       200:
 *         description: Rekap pemasukan
 */
router.get('/pemasukan', rekapController.rekapPemasukanList);


//
// =========================
// LIST TRANSAKSI GABUNGAN
// =========================
//

/**
 * @swagger
 * /rekap/transaksi_list_semua:
 *   get:
 *     tags: [Rekap]
 *     summary: Ambil semua transaksi pemasukan & pengeluaran suami/istri
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List gabungan transaksi
 */
router.get('/transaksi_list_semua', rekapController.transaksiListSemua);

module.exports = router;
