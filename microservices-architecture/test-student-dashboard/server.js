const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3011;
const LISA_URL = process.env.LISA_URL || 'http://localhost:5001';

app.use(cors());
app.use(express.json());

// Serve AMSS Student UI at root by default
const studentUiDir = path.resolve(__dirname, '../../AMSS/Student View');
app.use(express.static(studentUiDir));

// Keep minimal test page under /test
app.use('/test', express.static(path.join(__dirname, 'public')));

// Proxy to LISA for testing student editor
app.post('/api/lisa_prompt', async (req, res) => {
  try {
    const response = await fetch(`${LISA_URL}/lisa_prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'LISA unavailable', details: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'student-dashboard', timestamp: new Date().toISOString(), lisaUrl: LISA_URL });
});

app.listen(PORT, () => {
  console.log(`Student Dashboard Test Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Student UI (default): http://localhost:${PORT}/index.html`);
  console.log(`Test page: http://localhost:${PORT}/test/`);
});


