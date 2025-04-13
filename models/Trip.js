const db = require('../db/db-setup');
const { v4: uuidv4 } = require('uuid');

class Trip {
  // Find trip by id
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM trips WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Find trip by share code
  static findByShareCode(shareCode) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM trips WHERE share_code = ?', [shareCode], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get all trips for a user
  static getAllByUserId(userId) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM trips WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get shared trips for a user
  static getSharedWithUser(userId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT t.*, s.permission
        FROM trips t
        JOIN shares s ON t.id = s.trip_id
        WHERE s.user_id = ?
        ORDER BY t.created_at DESC
      `, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get public trips
  static getPublicTrips(limit = 10) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT t.*, u.username as creator_username
        FROM trips t
        JOIN users u ON t.user_id = u.id
        WHERE t.is_public = 1
        ORDER BY t.created_at DESC
        LIMIT ?
      `, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Create a new trip
  static create(tripData) {
    const shareCode = uuidv4().substring(0, 8);
    const { title, description, user_id, days, start_date, end_date, is_public } = tripData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO trips (title, description, user_id, days, start_date, end_date, is_public, share_code) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, description, user_id, days, start_date, end_date, is_public ? 1 : 0, shareCode],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...tripData, share_code: shareCode });
          }
        }
      );
    });
  }

  // Update a trip
  static update(id, tripData) {
    const { title, description, days, start_date, end_date, is_public } = tripData;

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE trips 
         SET title = ?, description = ?, days = ?, start_date = ?, end_date = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [title, description, days, start_date, end_date, is_public ? 1 : 0, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, ...tripData });
          }
        }
      );
    });
  }

  // Delete a trip
  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM trips WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id });
        }
      });
    });
  }

  // Share a trip with another user
  static shareWithUser(tripId, userId, permission = 'view') {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO shares (trip_id, user_id, permission) VALUES (?, ?, ?)',
        [tripId, userId, permission],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, trip_id: tripId, user_id: userId, permission });
          }
        }
      );
    });
  }

  // Update trip sharing permission
  static updateSharing(tripId, userId, permission) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE shares SET permission = ? WHERE trip_id = ? AND user_id = ?',
        [permission, tripId, userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ trip_id: tripId, user_id: userId, permission });
          }
        }
      );
    });
  }

  // Remove sharing with a user
  static removeSharing(tripId, userId) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM shares WHERE trip_id = ? AND user_id = ?',
        [tripId, userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ trip_id: tripId, user_id: userId });
          }
        }
      );
    });
  }

  // Get all users with whom a trip is shared
  static getSharedUsers(tripId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT u.id, u.username, u.email, s.permission
        FROM users u
        JOIN shares s ON u.id = s.user_id
        WHERE s.trip_id = ?
      `, [tripId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = Trip;