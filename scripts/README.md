# Scripts

This directory contains utility scripts for the live-editor project.

## record-demo.js

Records a demo video of the Live Editor application using Playwright.

### Prerequisites

- The development server must be running on `http://localhost:3000`
- Playwright browsers must be installed (`pnpm exec playwright install chromium`)

### Usage

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. In a separate terminal, run the recording script:
   ```bash
   pnpm record-demo
   # or
   node scripts/record-demo.js
   ```

3. The video will be saved to `docs/assets/` directory as a `.webm` file.

#### Custom URL

You can specify a custom URL for the demo recording:

```bash
DEMO_URL=http://localhost:4000 pnpm record-demo
# or
DEMO_URL=http://localhost:4000 node scripts/record-demo.js
```

### What it does

The script:
1. Launches a headless Chromium browser
2. Navigates to the local development server
3. Simulates typing various markdown content:
   - Headings
   - Paragraphs
   - Lists
   - Code blocks
   - Checklists
4. Scrolls through the content
5. Saves the recording as a WebM video (1280x720)

### Customization

You can modify the `record-demo.js` script to:
- Change the viewport size
- Add more interactions
- Adjust timing between actions (see `TIMING` configuration at the top of the script)
- Change the output format or location
- Use a different URL via the `DEMO_URL` environment variable
