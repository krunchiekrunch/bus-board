import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// port for the web app
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// change details here if you need to
app.get('/api/vehicles', async (req, res) => {
  const target =
    'https://api.stagecoach-technology.net/vehicle-tracking/v1/vehicles' +
    '?client_version=UKBUS_APP' +
    '&descriptive_fields=1' +
    '&lat=51.4548455319264' +
    '&lng=-0.978924276767977' +
    '&radius=20000';

    // might need to change user agent if doesnt work
  try {
    const response = await fetch(target, {
      headers: {
        'User-Agent': 'UKBUS_APP'
      }
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'HTTP 502' });
    }

    const data = await response.json();

    // code wont work without this?
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Proxy fetch failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Open http://localhost:${PORT}`);
});
