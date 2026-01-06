const { chromium } = require('@playwright/test');
const path = require('path');

async function recordDemo() {
  console.log('Starting demo recording...');
  
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: path.join(__dirname, '../docs/assets'),
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  try {
    // Navigate to the application
    console.log('Navigating to application...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Wait for the editor to be ready
    await page.waitForTimeout(1000);

    // Type a heading
    console.log('Typing heading...');
    await page.keyboard.type('# Live Editor Demo');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Type a paragraph
    console.log('Typing paragraph...');
    await page.keyboard.type('This is a block-based Markdown editor with real-time preview.');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Type another heading
    console.log('Typing subheading...');
    await page.keyboard.type('## Features');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Type a list
    console.log('Typing list...');
    await page.keyboard.type('- Real-time preview');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.keyboard.type('- Syntax highlighting');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.keyboard.type('- Drag & drop blocks');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Type code block
    console.log('Typing code block...');
    await page.keyboard.type('```javascript');
    await page.keyboard.press('Enter');
    await page.keyboard.type('console.log("Hello, World!");');
    await page.keyboard.press('Enter');
    await page.keyboard.type('```');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Type a checklist
    console.log('Typing checklist...');
    await page.keyboard.type('## Tasks');
    await page.keyboard.press('Enter');
    await page.keyboard.type('- [ ] Create demo video');
    await page.keyboard.press('Enter');
    await page.keyboard.type('- [ ] Update README');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Interact with the preview (scroll to show the content)
    console.log('Scrolling to show content...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);
    
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    console.log('Demo recording completed!');
  } catch (error) {
    console.error('Error during recording:', error);
    throw error;
  } finally {
    // Close context to save the video
    await context.close();
    await browser.close();

    console.log('Video saved to docs/assets directory');
  }
}

recordDemo().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
