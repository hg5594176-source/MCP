const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function smoothScrollTo(page, targetY, duration = 1800) {
  await page.evaluate(
    ({ targetY, duration }) => {
      return new Promise((resolve) => {
        const startY = window.scrollY;
        const diff = targetY - startY;
        const startTime = performance.now();

        function step(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // easeInOutCubic
          const ease =
            progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;

          window.scrollTo(0, startY + diff * ease);

          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(step);
      });
    },
    { targetY, duration }
  );
  await page.waitForTimeout(400);
}

async function moveMouseSmooth(page, startX, startY, endX, endY, steps = 30) {
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = startX + (endX - startX) * t;
    const y = startY + (endY - startY) * t;
    await page.mouse.move(x, y);
    await page.waitForTimeout(20);
  }
}

(async () => {
  const recordingsDir = path.resolve(__dirname, 'recordings');
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  console.log('Launching browser for 1080p video recording...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--enable-gpu-rasterization', '--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  console.log('Navigating to http://localhost:5174/ ...');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });

  // 1. HERO SECTION
  console.log('Capturing Hero Section...');
  await page.waitForTimeout(1500);

  // Move mouse through the center to interact with MetaBalls fluid simulation
  await moveMouseSmooth(page, 400, 300, 960, 450, 40);
  await moveMouseSmooth(page, 960, 450, 1400, 600, 40);
  await moveMouseSmooth(page, 1400, 600, 960, 540, 30);
  await page.waitForTimeout(2000); // Wait for SplitFlap flip text

  // 2. CAPABILITIES SECTION (PixelCards)
  console.log('Scrolling to Capabilities & interacting with PixelCards...');
  const capabilitiesSection = page.locator('#enter-gate');
  const capBox = await capabilitiesSection.boundingBox();
  if (capBox) {
    await smoothScrollTo(page, capBox.y - 40, 2000);
    await page.waitForTimeout(800);

    // Hover over Card 01, 02, 03 to reveal pixel matrix
    const cards = page.locator('#enter-gate .pixel-card');
    const count = await cards.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const cBox = await cards.nth(i).boundingBox();
        if (cBox) {
          await moveMouseSmooth(
            page,
            cBox.x + 20,
            cBox.y + 20,
            cBox.x + cBox.width / 2,
            cBox.y + cBox.height / 2,
            25
          );
          await page.waitForTimeout(700);
        }
      }
    }
  }

  // 3. SESSIONS & TIMELINE SECTION
  console.log('Scrolling to Sessions Timeline...');
  const sessionsSection = page.locator('#sessions');
  const sessBox = await sessionsSection.boundingBox();
  if (sessBox) {
    await smoothScrollTo(page, sessBox.y - 40, 1800);
    await page.waitForTimeout(1500);
  }

  // 4. HUMAN APPROVAL SECTION
  console.log('Scrolling to Human Approval...');
  const approvalSection = page.locator('#approval');
  const appBox = await approvalSection.boundingBox();
  if (appBox) {
    await smoothScrollTo(page, appBox.y - 40, 1800);
    await page.waitForTimeout(2000);
  }

  // 5. SANDBOX & SCANNER
  console.log('Scrolling to Docker Sandbox & Scanner...');
  const sandboxSection = page.locator('#sandbox');
  const sandBox = await sandboxSection.boundingBox();
  if (sandBox) {
    await smoothScrollTo(page, sandBox.y - 40, 1800);
    await page.waitForTimeout(1500);
  }

  // 6. AUDIT CHAIN SECTION
  console.log('Scrolling to Audit Chain & demonstrating tamper detection...');
  const auditSection = page.locator('#audit');
  const audBox = await auditSection.boundingBox();
  if (audBox) {
    await smoothScrollTo(page, audBox.y - 40, 1800);
    await page.waitForTimeout(1000);

    // Look for tamper toggle button if available
    const tamperBtn = auditSection.locator('button');
    if ((await tamperBtn.count()) > 0) {
      await tamperBtn.first().click();
      await page.waitForTimeout(1500);
    }
  }

  // 7. LIVE DEMO STEPPER
  console.log('Scrolling to Live Demo & stepping through comparisons...');
  const demoSection = page.locator('#demo');
  const demBox = await demoSection.boundingBox();
  if (demBox) {
    await smoothScrollTo(page, demBox.y - 40, 1800);
    await page.waitForTimeout(1000);

    const stepBtn = demoSection.locator('button.btn-primary');
    if ((await stepBtn.count()) > 0) {
      await stepBtn.click();
      await page.waitForTimeout(900);
      await stepBtn.click();
      await page.waitForTimeout(900);
      await stepBtn.click();
      await page.waitForTimeout(1200);
    }
  }

  // 8. FINAL HERO / CLOSING CTA
  console.log('Scrolling to Final CTA...');
  const closingSection = page.locator('#closing');
  const closeBox = await closingSection.boundingBox();
  if (closeBox) {
    await smoothScrollTo(page, closeBox.y - 40, 1800);
    await page.waitForTimeout(1800);
  }

  console.log('Recording finished. Closing browser...');
  await context.close();
  await browser.close();

  console.log('Video saved to recordings folder.');
})();
