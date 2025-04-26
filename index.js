const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Get Discord webhook URL from environment variables
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Add a simple health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// GitHub webhook handler
app.post('/api/github', async (req, res) => {
  try {
    const payload = req.body;

    if (payload.action === 'closed' && payload.issue) {
      const issueTitle = payload.issue.title;
      const issueUrl = payload.issue.html_url;

      if (DISCORD_WEBHOOK_URL) {
        await axios.post(DISCORD_WEBHOOK_URL, {
          content: `✅ Issue closed: **${issueTitle}**\n${issueUrl}`
        });
      } else {
        console.warn('DISCORD_WEBHOOK_URL not configured');
      }
    }

    res.status(200).end();
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
