import { chromium } from "playwright";

const BASE = "http://localhost:5173";
const API = "http://localhost:5149";
const shots = "C:\\Users\\anjal\\AppData\\Local\\Temp\\claude\\c--Users-anjal-Downloads-SkyCrash-Backend\\c4cf7bf8-85bc-482a-8106-7d2a1e4b6ea6\\scratchpad\\shots";
import { mkdirSync } from "fs";
mkdirSync(shots, { recursive: true });

const browser = await chromium.launch();

async function withPage(viewport, fn) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("console.error: " + m.text());
  });

  // Fake the backend so authenticated views render without a live server.
  await context.route(`${API}/**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const json = (body) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    if (url.endsWith("/api/auth/login") && method === "POST") {
      return json({ token: "fake-token", playerId: "p1", username: "tester", expiresAtUtc: new Date(Date.now() + 3600000).toISOString() });
    }
    if (url.endsWith("/api/players/me")) {
      return json({ playerId: "p1", username: "tester", email: "t@example.com", creditBalance: 12345, memberSinceUtc: new Date().toISOString(), isAdmin: false });
    }
    if (url.endsWith("/api/hangar/loadout")) {
      return json({ craftId: "jet", skinId: "sunset-runway" });
    }
    return route.fulfill({ status: 404, body: "not mocked" });
  });

  await fn(page, errors);
  await context.close();
  return errors;
}

const results = {};

// 1. Home page (no auth needed)
results.home = await withPage({ width: 1280, height: 800 }, async (page, errors) => {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${shots}/home.png` });
});

// 2. Login -> fake auth -> Play (desktop)
results.play = await withPage({ width: 1280, height: 800 }, async (page, errors) => {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${shots}/login.png` });

  page.on("response", (r) => {
    if (r.url().includes("localhost:5149")) errors.push(`RESP ${r.status()} ${r.request().method()} ${r.url()}`);
  });
  await page.fill('input[name="username"]', "tester");
  await page.fill('input[name="password"]', "password123");
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(1500);
  const token = await page.evaluate(() => localStorage.getItem("skycrash_token"));
  const errText = await page.locator('[role="alert"]').first().textContent().catch(() => null);
  errors.push(`TOKEN_AFTER_LOGIN=${token} FORM_ERROR=${errText}`);
  await page.goto(`${BASE}/play`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  errors.push(`URL_AFTER_GOTO_PLAY=${page.url()}`);
  await page.screenshot({ path: `${shots}/play-desktop.png` });

  // Click mute button and check aria-pressed toggles
  const muteBtn = page.locator('button[aria-label="Mute music"], button[aria-label="Unmute music"]').first();
  const before = await muteBtn.getAttribute("aria-pressed").catch(() => null);
  await muteBtn.click({ trial: false }).catch((e) => errors.push("mute click failed: " + e.message));
  await page.waitForTimeout(200);
  const after = await muteBtn.getAttribute("aria-pressed").catch(() => null);
  errors.push(`MUTE_TOGGLE before=${before} after=${after}`);

  // Drive first user gesture already happened via click; take another screenshot
  await page.screenshot({ path: `${shots}/play-desktop-after-mute.png` });
});

// 3. Mobile viewport for Play
results.playMobile = await withPage({ width: 375, height: 700 }, async (page, errors) => {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="username"]', "tester");
  await page.fill('input[name="password"]', "password123");
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(1500);
  await page.goto(`${BASE}/play`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${shots}/play-mobile.png` });
});

await browser.close();

console.log(JSON.stringify(results, null, 2));
