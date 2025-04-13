const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const tripRoutes = require('./trips');
const placeRoutes = require('./places');
const authMiddleware = require('../middlewares/auth');

// Apply auth middleware to all routes
router.use(authMiddleware.loadUser);

// Homepage
router.get('/', (req, res) => {
  // If user is logged in, redirect to trips
  if (req.session && req.session.userId) {
    return res.redirect('/trips');
  }
  
  // Otherwise show landing page
  res.render('index', { 
    title: 'ระบบวางแผนทริปท่องเที่ยว',
    baseUrl: req.baseUrl || '/'
  });
});

// Mount all routes
router.use('/', authRoutes);
router.use('/trips', tripRoutes);
router.use('/places', placeRoutes);

// 404 page
router.use((req, res) => {
  res.status(404).render('error', { 
    message: 'ไม่พบหน้าที่คุณต้องการ',
    error: { status: 404 },
    baseUrl: req.baseUrl || '/'
  });
});

// Error handler
router.use((err, req, res, next) => {
  console.error(err);
  
  res.status(err.status || 500).render('error', {
    message: 'เกิดข้อผิดพลาด',
    error: err,
    baseUrl: req.baseUrl || '/'
  });
});

module.exports = router;