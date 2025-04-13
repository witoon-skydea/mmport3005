const db = require('../db/db-setup');

class Activity {
  // Get all activities for a trip day
  static getAllByTripDayId(tripDayId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT a.*, p.name as place_name, p.address as place_address, p.image_url as place_image 
         FROM activities a
         LEFT JOIN places p ON a.place_id = p.id
         WHERE a.trip_day_id = ?
         ORDER BY a.order_num`,
        [tripDayId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  // Get all activities for a trip (across all days)
  static getAllByTripId(tripId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT a.*, td.day_number, td.day_title, p.name as place_name, p.address as place_address, p.image_url as place_image 
         FROM activities a
         JOIN trip_days td ON a.trip_day_id = td.id
         LEFT JOIN places p ON a.place_id = p.id
         WHERE td.trip_id = ?
         ORDER BY td.day_number, a.order_num`,
        [tripId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  // Find activity by id
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT a.*, p.name as place_name, p.address as place_address, p.image_url as place_image 
         FROM activities a
         LEFT JOIN places p ON a.place_id = p.id
         WHERE a.id = ?`,
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  // Create a new activity
  static create(activityData) {
    const { trip_day_id, place_id, title, start_time, end_time, notes, order_num } = activityData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO activities (trip_day_id, place_id, title, start_time, end_time, notes, order_num) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [trip_day_id, place_id, title, start_time, end_time, notes, order_num],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...activityData });
          }
        }
      );
    });
  }

  // Update an activity
  static update(id, activityData) {
    const { place_id, title, start_time, end_time, notes, order_num } = activityData;

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE activities 
         SET place_id = ?, title = ?, start_time = ?, end_time = ?, notes = ?, order_num = ?
         WHERE id = ?`,
        [place_id, title, start_time, end_time, notes, order_num, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, ...activityData });
          }
        }
      );
    });
  }

  // Delete an activity
  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM activities WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id });
        }
      });
    });
  }

  // Delete all activities for a trip day
  static deleteAllForTripDay(tripDayId) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM activities WHERE trip_day_id = ?', [tripDayId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ trip_day_id: tripDayId });
        }
      });
    });
  }

  // Reorder activities
  static reorder(tripDayId, activityIds) {
    return new Promise((resolve, reject) => {
      // Create a transaction
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        let hasError = false;
        
        // Update order for each activity
        activityIds.forEach((activityId, index) => {
          db.run(
            'UPDATE activities SET order_num = ? WHERE id = ? AND trip_day_id = ?',
            [index + 1, activityId, tripDayId],
            (err) => {
              if (err) {
                hasError = true;
                reject(err);
              }
            }
          );
        });

        if (!hasError) {
          db.run('COMMIT', (err) => {
            if (err) {
              reject(err);
            } else {
              resolve({ success: true });
            }
          });
        } else {
          db.run('ROLLBACK');
        }
      });
    });
  }
}

module.exports = Activity;