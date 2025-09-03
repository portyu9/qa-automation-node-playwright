const { fetchPosts } = require('../../src/apiClient');

describe('JSONPlaceholder API', () => {
  test('returns an array of posts with expected fields', async () => {
    const posts = await fetchPosts();
    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0);
    const post = posts[0];
    expect(post).toHaveProperty('id');
    expect(post).toHaveProperty('userId');
    expect(post).toHaveProperty('title');
    expect(post).toHaveProperty('body');
  });
});
