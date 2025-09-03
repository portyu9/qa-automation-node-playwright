/**
 * SQLite helper functions for demonstration of database testing in Jest.
 *
 * This module uses the `sqlite3` package directly. It exposes functions
 * to open a database, seed it with initial data and query it. The API
 * wraps sqlite3 callbacks in Promises so that tests can use async/await.
 */

const sqlite3 = require('sqlite3').verbose();

/**
 * Open a database connection. If no filename is provided, an in‑memory
 * database is created, which is useful for unit tests.
 * @param {string} [filename]
 * @returns {Promise<sqlite3.Database>}
 */
function openDb(filename = ':memory:') {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(filename, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

/**
 * Initialise the schema and seed data for the example. Creates a `users`
 * table and inserts a handful of rows. Returns a Promise that resolves
 * when seeding is complete.
 * @param {sqlite3.Database} db
 */
function seedDb(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS users (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           name TEXT NOT NULL,
           email TEXT NOT NULL UNIQUE
         )`,
        (err) => {
          if (err) return reject(err);
          const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
          stmt.run('Alice', 'alice@example.com');
          stmt.run('Bob', 'bob@example.com');
          stmt.run('Carol', 'carol@example.com', (err) => {
            stmt.finalize();
            if (err) return reject(err);
            resolve();
          });
        }
      );
    });
  });
}

/**
 * Retrieve all users from the database.
 * @param {sqlite3.Database} db
 * @returns {Promise<Array<{ id: number, name: string, email: string }>>}
 */
function getAllUsers(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users ORDER BY id', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = { openDb, seedDb, getAllUsers };
