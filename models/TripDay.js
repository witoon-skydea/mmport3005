const db = require('../db/db-setup');

class TripDay {
  // Get all days for a trip
  static getAllByTripId(tripId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM trip_days WHERE trip_id = ? ORDER BY day_number',
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

  // Get a specific day
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM trip_days WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Create a new day
  static create(dayData) {
    const { trip_id, day_number, day_title, date, notes } = dayData;

    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO trip_days (trip_id, day_number, day_title, date, notes) VALUES (?, ?, ?, ?, ?)',
        [trip_id, day_number, day_title, date, notes],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...dayData });
          }
        }
      );
    });
  }

  // Create multiple days at once for a trip
  static createMultiple(tripId, daysCount, startDate) {
    return new Promise((resolve, reject) => {
      // Create a transaction
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const days = [];
        const stmt = db.prepare(
          'INSERT INTO trip_days (trip_id, day_number, day_title, date) VALUES (?, ?, ?, ?)'
        );

        let hasError = false;
        
        for (let i = 1; i <= daysCount; i++) {
          // Calculate date if startDate is provided
          let date = null;
          if (startDate) {
            const dayDate = new Date(startDate);
            dayDate.setDate(dayDate.getDate() + (i - 1));
            date = dayDate.toISOString().split('T')[0];
          }

          stmt.run([tripId, i, `วันที่ ${i}`, date], function(err) {
            if (err) {
              hasError = true;
              reject(err);
            } else {
              days.push({
                id: this.lastID,
                trip_id: tripId,
                day_number: i,
                day_title: `วันที่ ${i}`,
                date
              });
            }
          });
        }

        stmt.finalize();

        if (!hasError) {
          db.run('COMMIT', (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(days);
            }
          });
        } else {
          db.run('ROLLBACK');
        }
      });
    });
  }

  // Update a day
  static update(id, dayData) {
    const { day_title, date, notes } = dayData;

    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE trip_days SET day_title = ?, date = ?, notes = ? WHERE id = ?',
        [day_title, date, notes, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, ...dayData });
          }
        }
      );
    });
  }

  // Delete a day
  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM trip_days WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id });
        }
      });
    });
  }

  // Delete all days for a trip
  static deleteAllForTrip(tripId) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM trip_days WHERE trip_id = ?', [tripId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ trip_id: tripId });
        }
      });
    });
  }
}

module.exports = TripDay;