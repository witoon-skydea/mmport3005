const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Create the db directory if it doesn't exist
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

// Connect to SQLite database
const dbPath = path.join(__dirname, 'trips.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database');
    
    // Create tables
    createTables();
  }
});

// Create necessary tables for the trip planner
function createTables() {
  console.log('Creating database tables...');
  
  // Use serialize to ensure tables are created in order
  db.serialize(() => {
    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, err => {
      if (err) console.error('Error creating users table:', err.message);
      else console.log('Users table created or already exists');
    });

    // Create trips table after users table is created
    db.run(`
      CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        user_id INTEGER,
        days INTEGER NOT NULL,
        start_date TEXT,
        end_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_public INTEGER DEFAULT 0,
        share_code TEXT UNIQUE,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `, err => {
      if (err) console.error('Error creating trips table:', err.message);
      else console.log('Trips table created or already exists');
    });

    // Create trip_days table
    db.run(`
      CREATE TABLE IF NOT EXISTS trip_days (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER,
        day_number INTEGER,
        day_title TEXT,
        date TEXT,
        notes TEXT,
        FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
      )
    `, err => {
      if (err) console.error('Error creating trip_days table:', err.message);
      else console.log('Trip days table created or already exists');
    });

    // Create places table
    db.run(`
      CREATE TABLE IF NOT EXISTS places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT,
        latitude REAL,
        longitude REAL,
        description TEXT,
        category TEXT,
        image_url TEXT
      )
    `, err => {
      if (err) console.error('Error creating places table:', err.message);
      else console.log('Places table created or already exists');
    });

    // Create activities table
    db.run(`
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_day_id INTEGER,
        place_id INTEGER,
        title TEXT NOT NULL,
        start_time TEXT,
        end_time TEXT,
        notes TEXT,
        order_num INTEGER,
        FOREIGN KEY (trip_day_id) REFERENCES trip_days (id) ON DELETE CASCADE,
        FOREIGN KEY (place_id) REFERENCES places (id) ON DELETE SET NULL
      )
    `, err => {
      if (err) console.error('Error creating activities table:', err.message);
      else console.log('Activities table created or already exists');
    });

    // Create shares table
    db.run(`
      CREATE TABLE IF NOT EXISTS shares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER,
        user_id INTEGER,
        permission TEXT DEFAULT 'view', -- 'view' or 'edit'
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `, err => {
      if (err) console.error('Error creating shares table:', err.message);
      else {
        console.log('Shares table created or already exists');
        
        // Only insert sample data after all tables are created
        insertSampleData();
      }
    });
  });
}

// Insert some sample data for development and testing
function insertSampleData() {
  console.log('Inserting sample data...');
  
  // Insert a sample user
  db.run(`INSERT OR IGNORE INTO users (username, email, password) VALUES (?, ?, ?)`, 
    ['demo', 'demo@example.com', 'password123'],
    function(err) {
      if (err) {
        console.error('Error inserting sample user:', err.message);
      } else {
        console.log('Sample user inserted or already exists');
        const userId = this.lastID || 1;
        
        // Insert a sample trip
        db.run(`INSERT OR IGNORE INTO trips (title, description, user_id, days, start_date, end_date, is_public, share_code) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ['เที่ยวเชียงใหม่ 3 วัน', 'ทริปท่องเที่ยวเชียงใหม่ในช่วงฤดูหนาว', userId, 3, 
           '2025-10-15', '2025-10-17', 1, 'CM001'],
          function(err) {
            if (err) {
              console.error('Error inserting sample trip:', err.message);
            } else {
              console.log('Sample trip inserted or already exists');
              const tripId = this.lastID || 1;
              
              // Insert sample trip days
              for (let i = 1; i <= 3; i++) {
                db.run(`INSERT OR IGNORE INTO trip_days (trip_id, day_number, day_title, date) 
                        VALUES (?, ?, ?, ?)`,
                  [tripId, i, `วันที่ ${i} ของทริปเชียงใหม่`, `2025-10-${14 + i}`],
                  function(err) {
                    if (err) {
                      console.error(`Error inserting day ${i}:`, err.message);
                    } else {
                      console.log(`Sample day ${i} inserted or already exists`);
                      const dayId = this.lastID || i;
                      
                      // Insert sample places
                      const places = [
                        ['ดอยสุเทพ', 'ตำบลสุเทพ อำเภอเมือง จังหวัดเชียงใหม่', 18.8049, 98.9216, 'วัดพระธาตุดอยสุเทพเป็นวัดที่มีความสำคัญมากที่สุดในเชียงใหม่', 'temple', 'https://example.com/doi-suthep.jpg'],
                        ['นิมมานเหมินทร์', 'ถนนนิมมานเหมินทร์ เชียงใหม่', 18.8005, 98.9672, 'ถนนช้อปปิ้งและร้านอาหารยอดนิยม', 'shopping', 'https://example.com/nimman.jpg'],
                        ['อุทยานแห่งชาติดอยอินทนนท์', 'อำเภอจอมทอง จังหวัดเชียงใหม่', 18.5889, 98.4862, 'จุดสูงสุดของประเทศไทย', 'nature', 'https://example.com/doi-inthanon.jpg']
                      ];
                      
                      places.forEach((place, idx) => {
                        db.run(`INSERT OR IGNORE INTO places (name, address, latitude, longitude, description, category, image_url) 
                                VALUES (?, ?, ?, ?, ?, ?, ?)`, place, function(err) {
                          if (err) {
                            console.error(`Error inserting place ${idx + 1}:`, err.message);
                          } else {
                            console.log(`Sample place ${idx + 1} inserted or already exists`);
                            const placeId = this.lastID || (idx + 1);
                            
                            // Insert sample activities for each day
                            if (i === 1 && idx === 0) {
                              db.run(`INSERT OR IGNORE INTO activities (trip_day_id, place_id, title, start_time, end_time, notes, order_num) 
                                      VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                [dayId, placeId, 'เยี่ยมชมดอยสุเทพ', '10:00', '13:00', 'ขึ้นบันได 309 ขั้น', 1],
                                err => {
                                  if (err) console.error('Error inserting activity:', err.message);
                                  else console.log('Sample activity inserted or already exists');
                                });
                            } else if (i === 2 && idx === 1) {
                              db.run(`INSERT OR IGNORE INTO activities (trip_day_id, place_id, title, start_time, end_time, notes, order_num) 
                                      VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                [dayId, placeId, 'ช้อปปิ้งที่นิมมานฯ', '14:00', '18:00', 'หาของกินอร่อยๆ', 1],
                                err => {
                                  if (err) console.error('Error inserting activity:', err.message);
                                  else console.log('Sample activity inserted or already exists');
                                });
                            } else if (i === 3 && idx === 2) {
                              db.run(`INSERT OR IGNORE INTO activities (trip_day_id, place_id, title, start_time, end_time, notes, order_num) 
                                      VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                [dayId, placeId, 'เที่ยวดอยอินทนนท์', '09:00', '16:00', 'เตรียมเสื้อกันหนาว', 1],
                                err => {
                                  if (err) console.error('Error inserting activity:', err.message);
                                  else console.log('Sample activity inserted or already exists');
                                });
                            }
                          }
                        });
                      });
                    }
                  });
              }
            }
          });
      }
    });
}

// Export the database connection
module.exports = db;