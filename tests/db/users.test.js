const { openDb, seedDb, getAllUsers } = require('../../src/db');

describe('SQLite database helper', () => {
  let db;

  beforeEach(() => {
    db = openDb();
    seedDb(db);
  });

  afterEach(() => {
    db.close();
  });

  test('returns seeded users in deterministic order', () => {
    const users = getAllUsers(db);

    expect(users).toHaveLength(3);
    expect(users.map(({ name, email }) => ({ name, email }))).toEqual([
      { name: 'Alice', email: 'alice@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
      { name: 'Carol', email: 'carol@example.com' },
    ]);
  });

  test('re-seeding replaces state instead of accumulating rows', () => {
    db.prepare('INSERT INTO users (name, email) VALUES (?, ?)').run('Transient', 'transient@example.com');

    seedDb(db);

    expect(getAllUsers(db)).toHaveLength(3);
  });

  test('enforces the database uniqueness contract', () => {
    const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');

    expect(() => insert.run('Duplicate', 'alice@example.com')).toThrow(/UNIQUE constraint failed/i);
  });
});
