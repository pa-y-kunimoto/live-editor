const { chromium } = require('@playwright/test');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

// Configuration
const DEMO_URL = process.env.DEMO_URL || 'http://localhost:3000';
const TIMING = {
  INITIAL_WAIT: 1000,
  SHORT_PAUSE: 300,
  MEDIUM_PAUSE: 500,
  LONG_PAUSE: 1000,
};

async function recordDemo() {
  console.log('Starting demo recording...');
  console.log(`Using URL: ${DEMO_URL}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--font-render-hinting=none', '--disable-font-subpixel-positioning'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: path.join(__dirname, '../docs/assets'),
      size: { width: 1280, height: 720 },
    },
    locale: 'en-US',
  });

  const page = await context.newPage();
  let videoPath = null;

  try {
    // Navigate to the application
    console.log('Navigating to application...');
    await page.goto(DEMO_URL, { waitUntil: 'networkidle' });

    // Wait for the editor to be ready
    await page.waitForTimeout(TIMING.INITIAL_WAIT);

    // Type a heading
    console.log('Typing heading...');
    await page.keyboard.type('# Live Editor Demo');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(TIMING.MEDIUM_PAUSE);

    // Type a paragraph
    console.log('Typing paragraph...');
    await page.keyboard.type('This is a block-based Markdown editor with real-time preview.');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(TIMING.MEDIUM_PAUSE);

    // Type another heading
    console.log('Typing subheading...');
    await page.keyboard.type('## Features');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(TIMING.MEDIUM_PAUSE);

    // Type a list
    console.log('Typing list...');
    await page.keyboard.type('- Real-time preview');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(TIMING.SHORT_PAUSE);
    await page.keyboard.type('- Syntax highlighting');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(TIMING.SHORT_PAUSE);
    await page.keyboard.type('- Drag & drop blocks');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(TIMING.MEDIUM_PAUSE);

    // Type code block
    console.log('Typing code block...');
    await page.keyboard.type('```javascript');
    await page.keyboard.press('Enter');
    await page.keyboard.type('console.log("Hello, World!");');
    await page.keyboard.press('Enter');
    await page.keyboard.type('```');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(TIMING.MEDIUM_PAUSE);

    // Type a checklist
    console.log('Typing checklist...');
    await page.keyboard.type('## Tasks');
    await page.keyboard.press('Enter');
    await page.keyboard.type('- [ ] Create demo video');
    await page.keyboard.press('Enter');
    await page.keyboard.type('- [ ] Update README');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(TIMING.LONG_PAUSE);

    // Interact with the preview (scroll to show the content)
    console.log('Scrolling to show content...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(TIMING.LONG_PAUSE);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(TIMING.LONG_PAUSE);

    console.log('Demo recording completed!');
  } catch (error) {
    console.error('Error during recording:', error);
    throw error;
  } finally {
    // Get video path before closing
    videoPath = await page.video().path();

    // Close context to save the video
    await context.close();
    await browser.close();

    console.log('Video saved to docs/assets directory');
  }

  // Convert WebM to GIF for GitHub compatibility
  try {
    console.log('Converting video to GIF...');
    const assetsDir = path.join(__dirname, '../docs/assets');
    const webmPath = path.join(assetsDir, 'demo.webm');
    const gifPath = path.join(assetsDir, 'demo.gif');

    // Rename the generated video to demo.webm
    if (videoPath && fs.existsSync(videoPath)) {
      fs.renameSync(videoPath, webmPath);
    }

    // Convert to GIF using ffmpeg with optimized palette
    execSync(
      `ffmpeg -i "${webmPath}" -vf "fps=10,scale=1280:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 -y "${gifPath}"`,
      { stdio: 'inherit' }
    );

    console.log('GIF conversion completed!');
    console.log(`WebM: ${webmPath}`);
    console.log(`GIF: ${gifPath}`);
  } catch (error) {
    console.error('Error converting to GIF:', error);
    console.log('Note: ffmpeg is required for GIF conversion. Install it with:');
    console.log('  Ubuntu/Debian: sudo apt-get install ffmpeg');
    console.log('  macOS: brew install ffmpeg');
  }
}

recordDemo().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
