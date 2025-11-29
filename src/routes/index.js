const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const pemasukanRoutes = require('./pemasukanRoutes');
const pengeluaranRoutes = require('./pengeluaranRoutes');
const hutangRoutes = require('./hutangRoutes');
const nbRoutes = require('./nbRoutes');
const rekapRoutes = require('./rekapRoutes');


// register all routes
router.use('/auth', authRoutes);
router.use('/pemasukan', pemasukanRoutes);
router.use('/pengeluaran', pengeluaranRoutes);
router.use('/hutang', hutangRoutes);
router.use('/nb', nbRoutes);
router.use('/rekap', rekapRoutes);

module.exports = router; // ✅ HARUS router langsung, bukan object
