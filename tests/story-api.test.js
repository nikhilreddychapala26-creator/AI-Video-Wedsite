const test = require("node:test");
const assert = require("node:assert/strict");

process.env.GEMINI_API_KEY = "test-key";
const app = require("../server");

test("story API integration checks", async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const originalFetch = global.fetch;

  t.after(async () => {
    global.fetch = originalFetch;
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  await t.test("health endpoint reports service status", async () => {
    const response = await fetch(`${base}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, service: "AI Video Studio" });
  });

  await t.test("empty story is rejected", async () => {
    const response = await fetch(`${base}/api/story`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ topic: "   " })
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /provide a story/i);
  });

  await t.test("successful provider response is returned as a story", async () => {
    global.fetch = async (url, options) => {
      assert.match(String(url), /generativelanguage\.googleapis\.com/);
      assert.equal(options.method, "POST");
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: "Scene 1: A village wakes at sunrise.\nScene 2: A young inventor finds a glowing compass." }] } }]
      }), { status: 200, headers: { "content-type": "application/json" } });
    };

    const response = await fetch(`${base}/api/story`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ topic: "A young village inventor", style: "IMAX-inspired cinematic" })
    });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.match(data.story, /Scene 1/);
    assert.match(data.story, /glowing compass/);
  });
});
