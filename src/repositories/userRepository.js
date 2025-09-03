const { openDb, seedDb } = require('../db');

class UserRepository {
    constructor(db) {
        this.db = db;
    }

    // Initialize a repository with a connection and seeded database
    static async initialize(dbFile = ':memory:') {
        const db = await openDb(dbFile);
        await seedDb(db);
        return new UserRepository(db);
    }

    // Fetch all users sorted by ID
    async findAll() {
        return this.all('SELECT * FROM users ORDER BY id');
    }

    // Fetch a single user by ID or return null
    async findById(id) {
        const rows = await this.all('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0] || null;
    }

    // Create a new user and return the inserted row ID
    async createUser(user) {
        const { name, email } = user;
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO users (name, email) VALUES (?, ?)',
                [name, email],
                function (err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(this.lastID);
                }
            );
        });
    }

    // Update an existing user record and return number of changed rows
    async updateUser(id, user) {
        const { name, email } = user;
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE users SET name = ?, email = ? WHERE id = ?',
                [name, email, id],
                function (err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(this.changes);
                }
            );
        });
    }

    // Delete a user by ID and return number of changed rows
    async deleteUser(id) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
                if (err) {
                    return reject(err);
                }
                resolve(this.changes);
            });
        });
    }

    // Helper to run SELECT queries and return rows
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    // Close the database connection
    async close() {
        return new Promise((resolve, reject) => {
            this.db.close(err => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = { UserRepository };
