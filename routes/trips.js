const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const dayController = require('../controllers/dayController');
const activityController = require('../controllers/activityController');
const authMiddleware = require('../middlewares/auth');
const Trip = require('../models/Trip');

// Apply authentication middleware to all routes
router.use(authMiddleware.isAuthenticated);

// Trip routes
router.get('/', tripController.listTrips);
router.get('/new', tripController.showCreateForm);
router.post('/', tripController.createTrip);
router.get('/:id', authMiddleware.canAccessTrip(Trip), tripController.showTrip);
router.get('/:id/edit', authMiddleware.isTripOwner(Trip), tripController.showEditForm);
router.post('/:id/update', authMiddleware.isTripOwner(Trip), tripController.updateTrip);
router.post('/:id/delete', authMiddleware.isTripOwner(Trip), tripController.deleteTrip);

// Trip sharing routes
router.get('/:id/share', authMiddleware.isTripOwner(Trip), tripController.showShareForm);
router.post('/:id/share', authMiddleware.isTripOwner(Trip), tripController.shareTrip);
router.post('/:id/share/:userId/remove', authMiddleware.isTripOwner(Trip), tripController.removeShare);

// Access shared trip by code (no auth required)
router.get('/shared/:code', tripController.accessSharedTrip);

// Day routes
router.get('/:tripId/days/:id/edit', authMiddleware.canAccessTrip(Trip), dayController.showEditForm);
router.post('/:tripId/days/:id/update', authMiddleware.canAccessTrip(Trip), dayController.updateDay);

// Activity routes
router.get('/:tripId/days/:dayId/activities/new', authMiddleware.canAccessTrip(Trip), activityController.showAddForm);
router.post('/:tripId/days/:dayId/activities', authMiddleware.canAccessTrip(Trip), activityController.addActivity);
router.get('/:tripId/activities/:id/edit', authMiddleware.canAccessTrip(Trip), activityController.showEditForm);
router.post('/:tripId/activities/:id/update', authMiddleware.canAccessTrip(Trip), activityController.updateActivity);
router.post('/:tripId/activities/:id/delete', authMiddleware.canAccessTrip(Trip), activityController.deleteActivity);

// API routes for activities
router.post('/api/activities/reorder', authMiddleware.isAuthenticated, activityController.reorderActivities);

module.exports = router;