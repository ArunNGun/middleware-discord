# GitHub to Discord Notification Service

This service listens for GitHub webhook events and forwards them to a Discord channel using webhooks.

## Features

- Receives GitHub webhook events
- Notifies Discord for various issue events:
  - Issues opened, closed, reopened
  - Issues assigned, labeled, milestoned
  - Issues transferred, pinned, edited
- Notifies Discord for pull request events:
  - Pull requests opened, closed, merged
  - Pull requests reopened, ready for review
  - Review requests, assignments
- Enhanced notification messages include:
  - Clickable links to issues and pull requests
  - Information about who created, closed, or modified the item
  - Assignee and reviewer details
  - Formatted messages with appropriate emojis
- Deployed as a serverless function on Vercel

## Deployment Instructions

### Prerequisites

- A [Vercel](https://vercel.com) account
- A Discord webhook URL (from Discord channel settings)

### Deploy to Vercel

1. Push this repository to GitHub
2. Import the repository in the Vercel dashboard
3. Set up the required environment variable in the Vercel dashboard:
   - Add the environment variable `DISCORD_WEBHOOK_URL` with your Discord webhook URL
4. Deploy the project

### Setting up the GitHub Webhook

1. Go to your GitHub repository
2. Navigate to Settings > Webhooks
3. Add a new webhook:
   - Payload URL: `https://your-vercel-deployment-url.vercel.app/github`
   - Content type: `application/json`
   - Select events:
     - Choose "Issues" for issue-related notifications
     - Choose "Pull requests" for PR-related notifications
     - Or select "Send me everything" to receive all notifications
   - Enable the webhook

## Local Development

1. Install dependencies:
   ```
   npm install
   ```
2. Create a `.env` file with your Discord webhook URL:
   ```
   DISCORD_WEBHOOK_URL=your-discord-webhook-url
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

- `/api/github.js` - Serverless function that handles GitHub webhook events
- `/vercel.json` - Configuration for Vercel deployment
- `/index.js` - Simple info page

## Environment Variables

- `DISCORD_WEBHOOK_URL`: Your Discord webhook URL (required)