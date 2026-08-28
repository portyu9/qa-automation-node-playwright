const Database = require('better-sqlite3');

const SEED_USERS = Object.freeze([
  Object.freeze({ name: 'Alice', email: 'alice@example.com' }),
  Object.freeze({ name: 'Bob', email: 'bob@example.com' }),
  Object.freeze({ name: 'Carol', email: 'carol@example.com' }),
]);

/**
 * Opens an isolated SQLite connection for data-layer verification.
 * File-backed databases use a bounded busy timeout; tests default to memory.
 *
 * @param {string} [filename]
 * @returns {Database.Database}
 */
function openDb(filename = ':memory:') {
  const db = new Database(filename, { timeout: 5000 });
  db.pragma('foreign_keys = ON');
  return db;
}

/**
 * Creates the users schema and replaces seed rows atomically so repeated test
 * setup is deterministic instead of accumulating shared state.
 *
 * @param {Database.Database} db
 */
function seedDb(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    )
  `);

  const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
  const replaceSeed = db.transaction((users) => {
    db.prepare('DELETE FROM users').run();
    for (const user of users) {
      insert.run(user.name, user.email);
    }
  });

  replaceSeed(SEED_USERS);
}

/**
 * Returns users in a deterministic order using a prepared statement.
 *
 * @param {Database.Database} db
 * @returns {Array<{ id: number, name: string, email: string }>}
 */
function getAllUsers(db) {
  return db.prepare('SELECT id, name, email FROM users ORDER BY id').all();
}

module.exports = { openDb, seedDb, getAllUsers };
