const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');
const authMiddleware = require('../middlewares/auth');

// Apply authentication middleware to all routes
router.use(authMiddleware.isAuthenticated);

// Place routes
router.get('/', placeController.listPlaces);
router.get('/new', placeController.showAddForm);
router.post('/', placeController.addPlace);
router.get('/:id', placeController.showPlace);
router.get('/:id/edit', placeController.showEditForm);
router.post('/:id/update', placeController.updatePlace);
router.post('/:id/delete', placeController.deletePlace);

// API routes
router.get('/api/search', placeController.searchPlaces);

module.exports = router;