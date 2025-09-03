const { openDb, seedDb, getAllUsers } = require('../../src/db');

describe('SQLite database helper', () => {
  let db;

  beforeAll(async () => {
    db = await openDb();
    await seedDb(db);
  });

  afterAll(async () => {
    db.close();
  });

  test('returns seeded users in order', async () => {
    const users = await getAllUsers(db);
    expect(users.length).toBe(3);
    expect(users[0].name).toBe('Alice');
    expect(users[1].email).toBe('bob@example.com');
  });
});
