const User = require('../models/User');

// Check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  
  // Remember the page they were trying to access
  req.session.returnTo = req.originalUrl;
  
  res.redirect('/login');
};

// Check if user is not authenticated (for login/register pages)
exports.isNotAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/trips');
  }
  next();
};

// Load user from session
exports.loadUser = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        req.user = user;
        res.locals.user = user; // Make user available in templates
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }
  res.locals.isAuthenticated = req.session && req.session.userId ? true : false;
  next();
};

// Check if user owns the trip
exports.isTripOwner = (Trip) => {
  return async (req, res, next) => {
    try {
      const tripId = req.params.id;
      const trip = await Trip.findById(tripId);
      
      if (!trip) {
        return res.status(404).render('error', { 
          message: 'ไม่พบทริปที่ต้องการ',
          error: { status: 404 }
        });
      }
      
      if (trip.user_id !== req.session.userId) {
        return res.status(403).render('error', { 
          message: 'คุณไม่มีสิทธิ์เข้าถึงทริปนี้',
          error: { status: 403 }
        });
      }
      
      // Store trip in request for later use
      req.trip = trip;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user can view or edit the trip (owner or has permission)
exports.canAccessTrip = (Trip) => {
  return async (req, res, next) => {
    try {
      const tripId = req.params.id;
      const trip = await Trip.findById(tripId);
      
      if (!trip) {
        return res.status(404).render('error', { 
          message: 'ไม่พบทริปที่ต้องการ',
          error: { status: 404 }
        });
      }
      
      // If user is the owner
      if (trip.user_id === req.session.userId) {
        req.trip = trip;
        req.canEdit = true;
        return next();
      }
      
      // If trip is public
      if (trip.is_public === 1) {
        req.trip = trip;
        req.canEdit = false;
        return next();
      }
      
      // Check if user has access through sharing
      db.get(
        'SELECT permission FROM shares WHERE trip_id = ? AND user_id = ?',
        [tripId, req.session.userId],
        (err, row) => {
          if (err) {
            return next(err);
          }
          
          if (!row) {
            return res.status(403).render('error', { 
              message: 'คุณไม่มีสิทธิ์เข้าถึงทริปนี้',
              error: { status: 403 }
            });
          }
          
          req.trip = trip;
          req.canEdit = row.permission === 'edit';
          next();
        }
      );
    } catch (error) {
      next(error);
    }
  };
};
