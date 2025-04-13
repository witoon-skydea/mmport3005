const Activity = require('../models/Activity');
const TripDay = require('../models/TripDay');
const Place = require('../models/Place');
const Trip = require('../models/Trip');

// Show form to add a new activity
exports.showAddForm = async (req, res) => {
  try {
    const tripId = req.params.tripId;
    const dayId = req.params.dayId;
    
    // Get the trip day
    const day = await TripDay.findById(dayId);
    
    if (!day || day.trip_id != tripId) {
      return res.status(404).render('error', {
        message: 'ไม่พบวันเดินทางที่ต้องการ',
        error: { status: 404 },
        baseUrl: req.baseUrl || '/'
      });
    }
    
    // Get the trip
    const trip = await Trip.findById(tripId);
    
    // Get all places for dropdown
    const places = await Place.getAll();
    
    res.render('activities/create', {
      title: 'เพิ่มกิจกรรม',
      trip,
      day,
      places,
      baseUrl: req.baseUrl || '/'
    });
  } catch (error) {
    console.error('Error showing add activity form:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการแสดงฟอร์มเพิ่มกิจกรรม',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Add a new activity
exports.addActivity = async (req, res) => {
  try {
    const tripId = req.params.tripId;
    const dayId = req.params.dayId;
    
    const { title, place_id, start_time, end_time, notes } = req.body;
    
    // Validate input
    if (!title) {
      const day = await TripDay.findById(dayId);
      const trip = await Trip.findById(tripId);
      const places = await Place.getAll();
      
      return res.render('activities/create', {
        title: 'เพิ่มกิจกรรม',
        error: 'กรุณากรอกชื่อกิจกรรม',
        formData: req.body,
        trip,
        day,
        places,
        baseUrl: req.baseUrl || '/'
      });
    }
    
    // Get current max order number
    const activities = await Activity.getAllByTripDayId(dayId);
    const maxOrder = activities.reduce((max, act) => Math.max(max, act.order_num || 0), 0);
    
    // Create activity
    const activityData = {
      trip_day_id: dayId,
      place_id: place_id || null,
      title,
      start_time: start_time || null,
      end_time: end_time || null,
      notes: notes || null,
      order_num: maxOrder + 1
    };
    
    await Activity.create(activityData);
    
    res.redirect(`/trips/${tripId}`);
  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการเพิ่มกิจกรรม',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Show form to edit an activity
exports.showEditForm = async (req, res) => {
  try {
    const tripId = req.params.tripId;
    const activityId = req.params.id;
    
    // Get the activity
    const activity = await Activity.findById(activityId);
    
    if (!activity) {
      return res.status(404).render('error', {
        message: 'ไม่พบกิจกรรมที่ต้องการ',
        error: { status: 404 },
        baseUrl: req.baseUrl || '/'
      });
    }
    
    // Get the trip day
    const day = await TripDay.findById(activity.trip_day_id);
    
    // Get the trip
    const trip = await Trip.findById(tripId);
    
    // Get all places for dropdown
    const places = await Place.getAll();
    
    res.render('activities/edit', {
      title: 'แก้ไขกิจกรรม',
      trip,
      day,
      activity,
      places,
      baseUrl: req.baseUrl || '/'
    });
  } catch (error) {
    console.error('Error showing edit activity form:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการแสดงฟอร์มแก้ไขกิจกรรม',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Update an activity
exports.updateActivity = async (req, res) => {
  try {
    const tripId = req.params.tripId;
    const activityId = req.params.id;
    
    const { title, place_id, start_time, end_time, notes } = req.body;
    
    // Get current activity
    const currentActivity = await Activity.findById(activityId);
    
    // Validate input
    if (!title) {
      const day = await TripDay.findById(currentActivity.trip_day_id);
      const trip = await Trip.findById(tripId);
      const places = await Place.getAll();
      
      return res.render('activities/edit', {
        title: 'แก้ไขกิจกรรม',
        error: 'กรุณากรอกชื่อกิจกรรม',
        trip,
        day,
        activity: { ...currentActivity, ...req.body },
        places,
        baseUrl: req.baseUrl || '/'
      });
    }
    
    // Update activity
    const activityData = {
      place_id: place_id || null,
      title,
      start_time: start_time || null,
      end_time: end_time || null,
      notes: notes || null,
      order_num: currentActivity.order_num
    };
    
    await Activity.update(activityId, activityData);
    
    res.redirect(`/trips/${tripId}`);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการอัพเดตกิจกรรม',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Delete an activity
exports.deleteActivity = async (req, res) => {
  try {
    const tripId = req.params.tripId;
    const activityId = req.params.id;
    
    await Activity.delete(activityId);
    
    res.redirect(`/trips/${tripId}`);
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการลบกิจกรรม',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Reorder activities (API)
exports.reorderActivities = async (req, res) => {
  try {
    const { dayId, activityIds } = req.body;
    
    await Activity.reorder(dayId, activityIds);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering activities:', error);
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการเรียงลำดับกิจกรรม'
    });
  }
};