import express from 'express';
import bodyParser from 'body-parser';
import puppeteer from 'puppeteer-core';
import dotenv from 'dotenv';
import locateChrome from 'locate-chrome';
import sharp from 'sharp';

dotenv.config();

const app = express();

app.use(bodyParser.json());

const sleep = ms => new Promise(res => setTimeout(res, ms));

app.get('/screenshot', async (req, res) => {
  const {
    url = 'https://www.google.com',
    width = 400,
    height = 225,
    type = 'webp',
    quality = 100,
    wait = 0
  } = req.query;

  if (!url) {
    return res.status(400).send('Missing URL');
  }

  let browser;

  try {
    const executablePath = await new Promise(resolve => locateChrome((arg) => resolve(arg))) || '';
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        // Use the `--no-sandbox` flag in CI environment for Puppeteer to work correctly
        '--no-sandbox',
        //use of the `--disable-setuid-sandbox` flag is not recommended as it reduces the security of the Chrome instance
        '--disable-setuid-sandbox',
        //use of the `--disable-dev-shm-usage` flag to prevent the browser from using /dev/shm
        '--disable-dev-shm-usage',
        //use of the `--disable-accelerated-2d-canvas` flag to disable hardware acceleration
        '--disable-gpu',
        //use of the `--no-first-run` flag to prevent the browser from showing a first run dialog
        '--no-first-run',
        //use of the `--no-zygote` flag to prevent the browser from starting a zygote process for each child process
        '--no-zygote',
        //use of the `--single-process` flag to prevent the browser from starting multiple processes
        '--single-process',
        //use of the `--disable-extensions` flag to prevent the browser from loading extensions
        '--disable-extensions',
        //use of '--disable-feature=site-per-process' flag to disable site isolation
        '--disable-features=site-per-process',

      ],
    });

    const page = await browser.newPage();
    await page.setViewport({
      height: 1080,
      width: 1920
    });
    await page.goto(url, {
      waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'],
    });

    if (parseInt(wait, 10) > 0) {
      await sleep(
        parseInt(wait, 10)
      );
    }
    let attempt = 0;
    let success = false;
    let screenshot;

    while (!success && attempt < 3) { // Attempt to capture the screenshot up to 3 times
      try {
        screenshot = await page.screenshot({ type: 'png' });
        success = true; // If screenshot is successful, exit the loop
      } catch (error) {
        console.error(`Screenshot attempt ${attempt + 1} failed: ${error.message}`);
        attempt++;
        await sleep(1000); // Wait a bit before retrying
      }
    }

    if (!success) {
      throw new Error('Failed to capture screenshot after multiple attempts.');
    }

    const resizedScreenshot = await sharp(screenshot)
      .resize(
        parseInt(width, 10),
        parseInt(height, 10),
        {
          fit: 'inside',
          withoutEnlargement: true,
        }
      )
      .toFormat(type, {
        quality: parseInt(quality, 10),
      })
      .toBuffer();

    res.type(`image/${type}`);

    // Send the resized screenshot as the response
    res.send(resizedScreenshot);

  } catch (error) {
    res.status(500).send(error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }


});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});