const User = require('../models/User');

// Display login form
exports.showLogin = (req, res) => {
  res.render('login', { 
    title: 'เข้าสู่ระบบ',
    baseUrl: req.baseUrl || '/'
  });
};

// Handle login form submission
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.render('login', { 
        title: 'เข้าสู่ระบบ',
        error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน',
        baseUrl: req.baseUrl || '/'
      });
    }
    
    // Authenticate user
    const user = await User.validateLogin(username, password);
    
    if (!user) {
      return res.render('login', { 
        title: 'เข้าสู่ระบบ',
        error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
        baseUrl: req.baseUrl || '/'
      });
    }
    
    // Set user session
    req.session.userId = user.id;
    
    // Redirect to intended page or default
    const returnTo = req.session.returnTo || '/trips';
    delete req.session.returnTo;
    
    res.redirect(returnTo);
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { 
      title: 'เข้าสู่ระบบ',
      error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง',
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Display registration form
exports.showRegister = (req, res) => {
  res.render('register', { 
    title: 'สมัครสมาชิก',
    baseUrl: req.baseUrl || '/'
  });
};

// Handle registration form submission
exports.register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.render('register', { 
        title: 'สมัครสมาชิก',
        error: 'กรุณากรอกข้อมูลให้ครบทุกช่อง',
        baseUrl: req.baseUrl || '/'
      });
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      return res.render('register', { 
        title: 'สมัครสมาชิก',
        error: 'รหัสผ่านไม่ตรงกัน',
        baseUrl: req.baseUrl || '/'
      });
    }
    
    // Check if username already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.render('register', { 
        title: 'สมัครสมาชิก',
        error: 'ชื่อผู้ใช้นี้มีในระบบแล้ว กรุณาใช้ชื่ออื่น',
        baseUrl: req.baseUrl || '/'
      });
    }
    
    // Check if email already exists
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.render('register', { 
        title: 'สมัครสมาชิก',
        error: 'อีเมลนี้มีในระบบแล้ว',
        baseUrl: req.baseUrl || '/'
      });
    }
    
    // Create user
    const user = await User.create(username, email, password);
    
    // Set user session
    req.session.userId = user.id;
    
    // Redirect to trips page
    res.redirect('/trips');
  } catch (error) {
    console.error('Registration error:', error);
    res.render('register', { 
      title: 'สมัครสมาชิก',
      error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง',
      baseUrl: req.baseUrl || '/'
    });
  }
};

// Handle logout
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
};
