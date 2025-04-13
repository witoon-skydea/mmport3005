const Trip = require('../models/Trip');
const TripDay = require('../models/TripDay');
const Activity = require('../models/Activity');
const Place = require('../models/Place');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

// List all trips for the current user
exports.listTrips = async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Get trips owned by user
    const userTrips = await Trip.getAllByUserId(userId);
    
    // Get trips shared with user
    const sharedTrips = await Trip.getSharedWithUser(userId);
    
    res.render('trips/index', {
      title: 'ทริปของฉัน',
      userTrips,
      sharedTrips,
      moment,
      baseUrl: req.baseUrl || '/'
    });
  } catch (error) {
    console.error('Error listing trips:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการแสดงรายการทริป',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Display form to create a new trip
exports.showCreateForm = (req, res) => {
  res.render('trips/create', {
    title: 'สร้างทริปใหม่',
    baseUrl: req.baseUrl || '/'
  });
};

// Create a new trip
exports.createTrip = async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const { title, description, days, start_date, end_date, is_public } = req.body;
    
    // Validate input
    if (!title || !days) {
      return res.render('trips/create', {
        title: 'สร้างทริปใหม่',
        error: 'กรุณากรอกชื่อทริปและจำนวนวัน',
        formData: req.body,
        baseUrl: req.baseUrl || '/'
      });
    }
    
    // Create trip
    const tripData = {
      title,
      description,
      user_id: userId,
      days: parseInt(days, 10),
      start_date: start_date || null,
      end_date: end_date || null,
      is_public: is_public === 'on' ? 1 : 0
    };
    
    const trip = await Trip.create(tripData);
    
    // Create days for the trip
    await TripDay.createMultiple(trip.id, trip.days, trip.start_date);
    
    res.redirect(`/trips/${trip.id}`);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.render('trips/create', {
      title: 'สร้างทริปใหม่',
      error: 'เกิดข้อผิดพลาดในการสร้างทริป กรุณาลองใหม่อีกครั้ง',
      formData: req.body,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Show a single trip
exports.showTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    
    // Trip is already loaded by middleware
    const trip = req.trip;
    
    // Get the trip days
    const days = await TripDay.getAllByTripId(tripId);
    
    // Get all activities for the trip
    const activities = await Activity.getAllByTripId(tripId);
    
    // Get trip owner
    const owner = await User.findById(trip.user_id);
    
    // Get all shared users
    const sharedUsers = await Trip.getSharedUsers(tripId);
    
    // Group activities by day
    const activityMap = {};
    days.forEach(day => {
      activityMap[day.id] = activities.filter(activity => activity.trip_day_id === day.id);
    });
    
    res.render('trips/show', {
      title: trip.title,
      trip,
      days,
      activityMap,
      owner,
      sharedUsers,
      canEdit: req.canEdit,
      moment,
      baseUrl: req.baseUrl || '/'
    });
  } catch (error) {
    console.error('Error showing trip:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการแสดงข้อมูลทริป',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Display form to edit a trip
exports.showEditForm = async (req, res) => {
  try {
    // Trip is already loaded by middleware
    const trip = req.trip;
    
    res.render('trips/edit', {
      title: `แก้ไข ${trip.title}`,
      trip,
      baseUrl: req.baseUrl || '/'
    });
  } catch (error) {
    console.error('Error showing edit form:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการแสดงฟอร์มแก้ไขทริป',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Update a trip
exports.updateTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    const { title, description, days, start_date, end_date, is_public } = req.body;
    
    // Get current trip
    const currentTrip = await Trip.findById(tripId);
    
    // Validate input
    if (!title || !days) {
      return res.render('trips/edit', {
        title: 'แก้ไขทริป',
        error: 'กรุณากรอกชื่อทริปและจำนวนวัน',
        trip: { ...currentTrip, ...req.body },
        baseUrl: req.baseUrl || '/'
      });
    }
    
    // Update trip
    const tripData = {
      title,
      description,
      days: parseInt(days, 10),
      start_date: start_date || null,
      end_date: end_date || null,
      is_public: is_public === 'on' ? 1 : 0
    };
    
    await Trip.update(tripId, tripData);
    
    // Handle days change
    const newDaysCount = parseInt(days, 10);
    const currentDaysCount = currentTrip.days;
    
    if (newDaysCount !== currentDaysCount) {
      if (newDaysCount > currentDaysCount) {
        // Add more days
        const startDate = currentTrip.start_date;
        let startDayNumber = currentDaysCount + 1;
        let startDateObj = null;
        
        if (startDate) {
          startDateObj = new Date(startDate);
          startDateObj.setDate(startDateObj.getDate() + currentDaysCount);
        }
        
        for (let i = startDayNumber; i <= newDaysCount; i++) {
          let date = null;
          if (startDateObj) {
            date = new Date(startDateObj);
            date.setDate(date.getDate() + (i - startDayNumber));
            date = date.toISOString().split('T')[0];
          }
          
          await TripDay.create({
            trip_id: tripId,
            day_number: i,
            day_title: `วันที่ ${i}`,
            date
          });
        }
      } else {
        // Remove days that exceed the new count
        const days = await TripDay.getAllByTripId(tripId);
        for (const day of days) {
          if (day.day_number > newDaysCount) {
            await TripDay.delete(day.id);
          }
        }
      }
    }
    
    res.redirect(`/trips/${tripId}`);
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการอัพเดตทริป',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Delete a trip
exports.deleteTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    
    await Trip.delete(tripId);
    
    res.redirect('/trips');
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการลบทริป',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Share a trip form
exports.showShareForm = async (req, res) => {
  try {
    // Trip is already loaded by middleware
    const trip = req.trip;
    
    // Get all shared users
    const sharedUsers = await Trip.getSharedUsers(trip.id);
    
    res.render('trips/share', {
      title: `แชร์ทริป ${trip.title}`,
      trip,
      sharedUsers,
      shareUrl: `${req.protocol}://${req.get('host')}/trips/shared/${trip.share_code}`,
      baseUrl: req.baseUrl || '/'
    });
  } catch (error) {
    console.error('Error showing share form:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการแสดงหน้าแชร์ทริป',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Share a trip with a user
exports.shareTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    const { username, permission } = req.body;
    
    // Find user by username
    const user = await User.findByUsername(username);
    
    if (!user) {
      const trip = await Trip.findById(tripId);
      const sharedUsers = await Trip.getSharedUsers(tripId);
      
      return res.render('trips/share', {
        title: `แชร์ทริป ${trip.title}`,
        trip,
        sharedUsers,
        error: 'ไม่พบผู้ใช้งานนี้ในระบบ',
        shareUrl: `${req.protocol}://${req.get('host')}/trips/shared/${trip.share_code}`,
        baseUrl: req.baseUrl || '/'
      });
    }
    
    // Don't allow sharing with self
    if (user.id === req.session.userId) {
      const trip = await Trip.findById(tripId);
      const sharedUsers = await Trip.getSharedUsers(tripId);
      
      return res.render('trips/share', {
        title: `แชร์ทริป ${trip.title}`,
        trip,
        sharedUsers,
        error: 'ไม่สามารถแชร์ทริปกับตัวเองได้',
        shareUrl: `${req.protocol}://${req.get('host')}/trips/shared/${trip.share_code}`,
        baseUrl: req.baseUrl || '/'
      });
    }
    
    // Share the trip
    await Trip.shareWithUser(tripId, user.id, permission);
    
    res.redirect(`/trips/${tripId}/share`);
  } catch (error) {
    console.error('Error sharing trip:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการแชร์ทริป',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Remove share access
exports.removeShare = async (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.params.userId;
    
    await Trip.removeSharing(tripId, userId);
    
    res.redirect(`/trips/${tripId}/share`);
  } catch (error) {
    console.error('Error removing share:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการยกเลิกการแชร์',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Access a shared trip by code
exports.accessSharedTrip = async (req, res) => {
  try {
    const shareCode = req.params.code;
    
    // Find trip by share code
    const trip = await Trip.findByShareCode(shareCode);
    
    if (!trip) {
      return res.status(404).render('error', {
        message: 'ไม่พบทริปที่ต้องการ',
        error: { status: 404 },
        baseUrl: req.baseUrl || '/'
      });
    }
    
    // If user is logged in, check if they can access directly
    if (req.session.userId) {
      if (trip.user_id === req.session.userId) {
        return res.redirect(`/trips/${trip.id}`);
      }
      
      // Check if user already has access
      const sharedUsers = await Trip.getSharedUsers(trip.id);
      const userHasAccess = sharedUsers.some(u => u.id === req.session.userId);
      
      if (userHasAccess) {
        return res.redirect(`/trips/${trip.id}`);
      }
      
      // Add access for logged in user
      await Trip.shareWithUser(trip.id, req.session.userId, 'view');
      
      return res.redirect(`/trips/${trip.id}`);
    }
    
    // Otherwise show a preview page for non-logged in users
    const days = await TripDay.getAllByTripId(trip.id);
    const activities = await Activity.getAllByTripId(trip.id);
    const owner = await User.findById(trip.user_id);
    
    // Group activities by day
    const activityMap = {};
    days.forEach(day => {
      activityMap[day.id] = activities.filter(activity => activity.trip_day_id === day.id);
    });
    
    res.render('trips/preview', {
      title: trip.title,
      trip,
      days,
      activityMap,
      owner,
      shareCode,
      moment,
      baseUrl: req.baseUrl || '/'
    });
  } catch (error) {
    console.error('Error accessing shared trip:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการเข้าถึงทริปที่แชร์',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};