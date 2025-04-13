const TripDay = require('../models/TripDay');
const Trip = require('../models/Trip');

// Show form to edit a day
exports.showEditForm = async (req, res) => {
  try {
    const tripId = req.params.tripId;
    const dayId = req.params.id;
    
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
    
    res.render('days/edit', {
      title: 'แก้ไขข้อมูลวันเดินทาง',
      trip,
      day,
      baseUrl: req.baseUrl || '/'
    });
  } catch (error) {
    console.error('Error showing edit day form:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการแสดงฟอร์มแก้ไขวันเดินทาง',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Update a day
exports.updateDay = async (req, res) => {
  try {
    const tripId = req.params.tripId;
    const dayId = req.params.id;
    
    const { day_title, date, notes } = req.body;
    
    // Get current day
    const currentDay = await TripDay.findById(dayId);
    
    // Validate input
    if (!day_title) {
      const trip = await Trip.findById(tripId);
      
      return res.render('days/edit', {
        title: 'แก้ไขข้อมูลวันเดินทาง',
        error: 'กรุณากรอกชื่อวันเดินทาง',
        trip,
        day: { ...currentDay, ...req.body },
        baseUrl: req.baseUrl || '/'
      });
    }
    
    // Update day
    const dayData = {
      day_title,
      date: date || null,
      notes: notes || null
    };
    
    await TripDay.update(dayId, dayData);
    
    res.redirect(`/trips/${tripId}`);
  } catch (error) {
    console.error('Error updating day:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการอัพเดตวันเดินทาง',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};