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
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({
      height: 1080,
      width: 1920
    });
    await page.goto(url, {
      waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'],
    });

    if (wait > 0) {
      await sleep(wait);
    }

    const screenshot = await page.screenshot({
      type: 'png',
    });

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