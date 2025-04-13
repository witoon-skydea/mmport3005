const Place = require('../models/Place');

// List all places
exports.listPlaces = async (req, res) => {
  try {
    const places = await Place.getAll();
    const categories = await Place.getCategories();
    
    res.render('places/index', {
      title: 'สถานที่ท่องเที่ยว',
      places,
      categories,
      baseUrl: req.baseUrl || '/'
    });
  } catch (error) {
    console.error('Error listing places:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการแสดงรายการสถานที่',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Show form to add a new place
exports.showAddForm = (req, res) => {
  res.render('places/create', {
    title: 'เพิ่มสถานที่ท่องเที่ยว',
    baseUrl: req.baseUrl || '/'
  });
};

// Add a new place
exports.addPlace = async (req, res) => {
  try {
    const { name, address, latitude, longitude, description, category, image_url } = req.body;
    
    // Validate input
    if (!name) {
      return res.render('places/create', {
        title: 'เพิ่มสถานที่ท่องเที่ยว',
        error: 'กรุณากรอกชื่อสถานที่',
        formData: req.body,
        baseUrl: req.baseUrl || '/'
      });
    }
    
    // Create place
    const placeData = {
      name,
      address: address || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      description: description || null,
      category: category || null,
      image_url: image_url || null
    };
    
    await Place.create(placeData);
    
    res.redirect('/places');
  } catch (error) {
    console.error('Error adding place:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการเพิ่มสถานที่',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Show details of a place
exports.showPlace = async (req, res) => {
  try {
    const placeId = req.params.id;
    
    const place = await Place.findById(placeId);
    
    if (!place) {
      return res.status(404).render('error', {
        message: 'ไม่พบสถานที่ท่องเที่ยวที่ต้องการ',
        error: { status: 404 },
        baseUrl: req.baseUrl || '/'
      });
    }
    
    res.render('places/show', {
      title: place.name,
      place,
      baseUrl: req.baseUrl || '/'
    });
  } catch (error) {
    console.error('Error showing place:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการแสดงรายละเอียดสถานที่',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Show form to edit a place
exports.showEditForm = async (req, res) => {
  try {
    const placeId = req.params.id;
    
    const place = await Place.findById(placeId);
    
    if (!place) {
      return res.status(404).render('error', {
        message: 'ไม่พบสถานที่ท่องเที่ยวที่ต้องการ',
        error: { status: 404 },
        baseUrl: req.baseUrl || '/'
      });
    }
    
    res.render('places/edit', {
      title: `แก้ไข ${place.name}`,
      place,
      baseUrl: req.baseUrl || '/'
    });
  } catch (error) {
    console.error('Error showing edit place form:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการแสดงฟอร์มแก้ไขสถานที่',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Update a place
exports.updatePlace = async (req, res) => {
  try {
    const placeId = req.params.id;
    const { name, address, latitude, longitude, description, category, image_url } = req.body;
    
    // Get current place
    const currentPlace = await Place.findById(placeId);
    
    // Validate input
    if (!name) {
      return res.render('places/edit', {
        title: 'แก้ไขสถานที่ท่องเที่ยว',
        error: 'กรุณากรอกชื่อสถานที่',
        place: { ...currentPlace, ...req.body },
        baseUrl: req.baseUrl || '/'
      });
    }
    
    // Update place
    const placeData = {
      name,
      address: address || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      description: description || null,
      category: category || null,
      image_url: image_url || null
    };
    
    await Place.update(placeId, placeData);
    
    res.redirect(`/places/${placeId}`);
  } catch (error) {
    console.error('Error updating place:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการอัพเดตสถานที่',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Delete a place
exports.deletePlace = async (req, res) => {
  try {
    const placeId = req.params.id;
    
    await Place.delete(placeId);
    
    res.redirect('/places');
  } catch (error) {
    console.error('Error deleting place:', error);
    res.status(500).render('error', {
      message: 'เกิดข้อผิดพลาดในการลบสถานที่',
      error,
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Search places (API)
exports.searchPlaces = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }
    
    const places = await Place.search(query);
    
    res.json(places);
  } catch (error) {
    console.error('Error searching places:', error);
    res.status(500).json({ error: 'Error searching places' });
  }
};