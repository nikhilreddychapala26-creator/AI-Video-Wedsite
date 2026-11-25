const test = require("node:test");
const assert = require("node:assert/strict");

process.env.GEMINI_API_KEY = "test-key";
process.env.AI_PROVIDER = "gemini";
const app = require("../server");

test("story API integration checks", async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const originalFetch = global.fetch;
  const originalProvider = process.env.AI_PROVIDER;

  t.after(async () => {
    global.fetch = originalFetch;
    process.env.AI_PROVIDER = originalProvider;
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  await t.test("health endpoint reports the selected provider", async () => {
    const response = await originalFetch(`${base}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      ok: true,
      service: "AI Video Studio",
      provider: "gemini"
    });
  });

  await t.test("empty story is rejected", async () => {
    const response = await originalFetch(`${base}/api/story`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ topic: "   " })
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /provide a story/i);
  });

  await t.test("Gemini provider returns a generated story", async () => {
    process.env.AI_PROVIDER = "gemini";
    global.fetch = async (url, options) => {
      assert.match(String(url), /generativelanguage\.googleapis\.com/);
      assert.equal(options.method, "POST");
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: "Scene 1: A village wakes at sunrise.\nScene 2: A young inventor finds a glowing compass." }] } }]
      }), { status: 200, headers: { "content-type": "application/json" } });
    };

    const response = await originalFetch(`${base}/api/story`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ topic: "A young village inventor", style: "cinematic" })
    });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.provider, "gemini");
    assert.match(data.story, /Scene 1/);
    assert.match(data.story, /glowing compass/);
  });

  await t.test("Ollama provider sends a local chat request", async () => {
    process.env.AI_PROVIDER = "ollama";
    global.fetch = async (url, options) => {
      assert.equal(String(url), "http://127.0.0.1:11434/api/chat");
      assert.equal(options.method, "POST");
      const body = JSON.parse(options.body);
      assert.equal(body.model, "tinyllama");
      assert.equal(body.stream, false);
      assert.equal(body.messages[0].role, "user");
      return new Response(JSON.stringify({
        message: { content: "Scene 1: A village inventor discovers a glowing compass." }
      }), { status: 200, headers: { "content-type": "application/json" } });
    };

    const response = await originalFetch(`${base}/api/story`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ topic: "A village inventor" })
    });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.provider, "ollama");
    assert.match(data.story, /glowing compass/);
  });

  await t.test("unsupported provider returns a clear error", async () => {
    process.env.AI_PROVIDER = "unknown";
    const response = await originalFetch(`${base}/api/story`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ topic: "A short story" })
    });
    assert.equal(response.status, 500);
    assert.match((await response.json()).error, /unsupported AI_PROVIDER/i);
  });
});
