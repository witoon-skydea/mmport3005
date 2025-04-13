const db = require('../db/db-setup');

class Place {
  // Find place by id
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM places WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Find place by name (partial match)
  static findByName(name) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM places WHERE name LIKE ?', [`%${name}%`], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get all places
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM places ORDER BY name', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get places by category
  static getByCategory(category) {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM places WHERE category = ? ORDER BY name', [category], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Create a new place
  static create(placeData) {
    const { name, address, latitude, longitude, description, category, image_url } = placeData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO places (name, address, latitude, longitude, description, category, image_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, address, latitude, longitude, description, category, image_url],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...placeData });
          }
        }
      );
    });
  }

  // Update a place
  static update(id, placeData) {
    const { name, address, latitude, longitude, description, category, image_url } = placeData;

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE places 
         SET name = ?, address = ?, latitude = ?, longitude = ?, description = ?, category = ?, image_url = ?
         WHERE id = ?`,
        [name, address, latitude, longitude, description, category, image_url, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, ...placeData });
          }
        }
      );
    });
  }

  // Delete a place
  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM places WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id });
        }
      });
    });
  }

  // Search places by query
  static search(query, limit = 10) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM places 
         WHERE name LIKE ? OR address LIKE ? OR description LIKE ? 
         ORDER BY name
         LIMIT ?`,
        [`%${query}%`, `%${query}%`, `%${query}%`, limit],
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

  // Get categories with counts
  static getCategories() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT category, COUNT(*) as count 
         FROM places 
         GROUP BY category 
         ORDER BY count DESC`,
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
}

module.exports = Place;