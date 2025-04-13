const db = require('../db/db-setup');
const bcrypt = require('bcrypt');

class User {
  // Find user by id
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Find user by username
  static findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Find user by email
  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Create a new user
  static async create(username, email, password) {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, username, email });
          }
        }
      );
    });
  }

  // Validate user login
  static async validateLogin(username, password) {
    const user = await this.findByUsername(username);
    if (!user) {
      return false;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return false;
    }

    return user;
  }

  // Get all users
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT id, username, email, created_at FROM users', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = User;