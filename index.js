const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const DISCORD_WEBHOOK_URL = 'your-discord-webhook-url';

app.post('/github', async (req, res) => {
  const payload = req.body;

  if (payload.action === 'closed' && payload.issue) {
    const issueTitle = payload.issue.title;
    const issueUrl = payload.issue.html_url;

    await axios.post(DISCORD_WEBHOOK_URL, {
      content: `✅ Issue closed: **${issueTitle}**\n${issueUrl}`
    });
  }

  res.status(200).end();
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
