import express from 'express';
import bodyParser from 'body-parser';
import captureWebsite from 'capture-website';
import dotenv from 'dotenv';
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

  if (isNaN(width) || isNaN(height)) {
    return res.status(400).send('Width and height must be numbers');
  }

  if (isNaN(quality)) {
    return res.status(400).send('Quality must be a number');
  }

  if (isNaN(wait)) {
    return res.status(400).send('Wait must be a number');
  }

  const website = await captureWebsite.buffer(url, {
    width: 1920,
    height: 1080,
    type,
    quality: (type === 'webp' || type === 'jpeg') ? quality : undefined,
    delay: parseFloat(wait),
  });

  const image = await sharp(website)
    .resize(parseInt(width), parseInt(height))
    .toBuffer();

  res.type(`image/${type}`);

  res.send(image);

});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});