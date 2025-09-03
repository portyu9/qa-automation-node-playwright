/**
 * Simple API client that fetches data from a public JSON API using Node's built‑in
 * https module. The functions in this module return Promises that resolve
 * with parsed JSON data.
 */

const https = require('https');

/**
 * Perform an HTTPS GET request and return a Promise that resolves with the
 * parsed JSON response body.
 * @param {string} url
 * @returns {Promise<any>}
 */
function getJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', (err) => reject(err));
  });
}

/**
 * Fetch a list of posts from the JSONPlaceholder API. JSONPlaceholder is a free
 * fake REST API for testing and prototyping. See https://jsonplaceholder.typicode.com/.
 * @returns {Promise<Array<{ id: number, userId: number, title: string, body: string }>>}
 */
async function fetchPosts() {
  return getJson('https://jsonplaceholder.typicode.com/posts');
}

module.exports = { fetchPosts };
