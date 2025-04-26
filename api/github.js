// Use ESM import for better compatibility with Vercel
import axios from 'axios';

// Simple logging utility with timestamps
const logger = {
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] [${timestamp}] ${message}`, data ? data : '');
  },
  warn: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] [${timestamp}] ${message}`, data ? data : '');
  },
  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] [${timestamp}] ${message}`, error ? error : '');
  },
  debug: (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG] [${timestamp}] ${message}`, data ? data : '');
  }
};

export default async function handler(req, res) {
  logger.info(`Received ${req.method} request to ${req.url}`);
  
  // Log headers for debugging
  logger.debug('Request headers:', req.headers);
  
  if (req.method === 'POST') {
    try {
      logger.info('Processing webhook payload');
      const payload = req.body;
      
      // Log event type
      logger.debug('Webhook event:', {
        event: req.headers['x-github-event'],
        action: payload.action,
        hasIssue: !!payload.issue,
        hasPR: !!payload.pull_request
      });

      // Handle issue events
      if (payload.issue) {
        logger.info(`Processing issue event: ${payload.action}`);
        const issueTitle = payload.issue.title;
        const issueUrl = payload.issue.html_url;
        const action = payload.action;
        let message = '';
        
        // Get issue creator and assignee info
        const creator = payload.issue.user?.login || 'Unknown';
        const assignees = payload.issue.assignees || [];
        const assigneeText = assignees.length > 0
          ? `Assigned to: ${assignees.map(a => `**${a.login}**`).join(', ')}`
          : 'Unassigned';
        
        // Format message based on the action
        switch (action) {
          case 'opened':
            message = `🆕 Issue opened by **${creator}**\n**${issueTitle}**\n${assigneeText}\n[View Issue](${issueUrl})`;
            break;
          case 'closed':
            const closedBy = payload.sender?.login || 'Unknown';
            message = `✅ Issue closed by **${closedBy}**\n**${issueTitle}**\n${assigneeText}\n[View Issue](${issueUrl})`;
            break;
          case 'reopened':
            const reopenedBy = payload.sender?.login || 'Unknown';
            message = `🔄 Issue reopened by **${reopenedBy}**\n**${issueTitle}**\n${assigneeText}\n[View Issue](${issueUrl})`;
            break;
          case 'assigned':
            const assignee = payload.assignee?.login || 'someone';
            message = `👤 Issue assigned to **${assignee}** by **${payload.sender?.login || 'Unknown'}**\n**${issueTitle}**\n[View Issue](${issueUrl})`;
            break;
          case 'labeled':
            const label = payload.label?.name || 'a label';
            message = `🏷️ Issue labeled with "**${label}**"\n**${issueTitle}**\n${assigneeText}\n[View Issue](${issueUrl})`;
            break;
          case 'milestoned':
            const milestone = payload.milestone?.title || 'a milestone';
            message = `🎯 Issue added to milestone "**${milestone}**"\n**${issueTitle}**\n${assigneeText}\n[View Issue](${issueUrl})`;
            break;
          case 'transferred':
            message = `📦 Issue transferred\n**${issueTitle}**\n${assigneeText}\n[View Issue](${issueUrl})`;
            break;
          case 'pinned':
            message = `📌 Issue pinned\n**${issueTitle}**\n${assigneeText}\n[View Issue](${issueUrl})`;
            break;
          case 'edited':
            const editedBy = payload.sender?.login || 'Unknown';
            message = `✏️ Issue edited by **${editedBy}**\n**${issueTitle}**\n${assigneeText}\n[View Issue](${issueUrl})`;
            break;
          default:
            message = `🔔 Issue ${action}\n**${issueTitle}**\n${assigneeText}\n[View Issue](${issueUrl})`;
        }
        
        // Log the formatted message
        logger.debug('Formatted issue message:', { message });
        
        // Send notification to Discord
        if (process.env.DISCORD_WEBHOOK_URL && message) {
          logger.info(`Sending Discord notification for issue ${payload.issue.number}`);
          try {
            const response = await axios.post(process.env.DISCORD_WEBHOOK_URL, {
              content: message
            });
            logger.info(`Discord notification sent successfully, status: ${response.status}`);
          } catch (discordError) {
            logger.error('Failed to send Discord notification for issue', discordError);
          }
        } else if (!process.env.DISCORD_WEBHOOK_URL) {
          logger.warn('DISCORD_WEBHOOK_URL not configured');
        }
      }
      
      // Handle pull request events
      if (payload.pull_request) {
        logger.info(`Processing pull request event: ${payload.action}`);
        logger.debug('Pull request details:', {
          number: payload.pull_request.number,
          title: payload.pull_request.title,
          state: payload.pull_request.state,
          merged: !!payload.pull_request.merged
        });
        
        const prTitle = payload.pull_request.title;
        const prUrl = payload.pull_request.html_url;
        const action = payload.action;
        let message = '';
        
        // Get PR creator and reviewers info
        const creator = payload.pull_request.user?.login || 'Unknown';
        const requestedReviewers = payload.pull_request.requested_reviewers || [];
        const reviewersText = requestedReviewers.length > 0
          ? `Reviewers: ${requestedReviewers.map(r => `**${r.login}**`).join(', ')}`
          : 'No reviewers assigned';
        
        // Format message based on the action
        switch (action) {
          case 'opened':
            message = `🔌 Pull request opened by **${creator}**\n**${prTitle}**\n${reviewersText}\n[View PR](${prUrl})`;
            break;
          case 'closed':
            const closedBy = payload.sender?.login || 'Unknown';
            if (payload.pull_request.merged) {
              const mergedBy = payload.pull_request.merged_by?.login || closedBy;
              message = `🟣 Pull request merged by **${mergedBy}**\n**${prTitle}**\n[View PR](${prUrl})`;
            } else {
              message = `❌ Pull request closed without merging by **${closedBy}**\n**${prTitle}**\n[View PR](${prUrl})`;
            }
            break;
          case 'reopened':
            const reopenedBy = payload.sender?.login || 'Unknown';
            message = `🔄 Pull request reopened by **${reopenedBy}**\n**${prTitle}**\n${reviewersText}\n[View PR](${prUrl})`;
            break;
          case 'ready_for_review':
            message = `👀 Pull request ready for review\n**${prTitle}**\n${reviewersText}\n[View PR](${prUrl})`;
            break;
          case 'review_requested':
            const reviewer = payload.requested_reviewer?.login || 'someone';
            message = `🔍 Review requested from **${reviewer}**\n**${prTitle}**\n[View PR](${prUrl})`;
            break;
          case 'assigned':
            const assignee = payload.assignee?.login || 'someone';
            message = `👤 Pull request assigned to **${assignee}**\n**${prTitle}**\n[View PR](${prUrl})`;
            break;
          default:
            message = `🔔 Pull request ${action}\n**${prTitle}**\n[View PR](${prUrl})`;
        }
        
        // Log the formatted message
        logger.debug('Formatted PR message:', { message });
        
        // Send notification to Discord
        if (process.env.DISCORD_WEBHOOK_URL && message) {
          logger.info(`Sending Discord notification for PR ${payload.pull_request.number}`);
          try {
            const response = await axios.post(process.env.DISCORD_WEBHOOK_URL, {
              content: message
            });
            logger.info(`Discord notification sent successfully, status: ${response.status}`);
          } catch (discordError) {
            logger.error('Failed to send Discord notification for pull request', discordError);
          }
        } else if (!process.env.DISCORD_WEBHOOK_URL) {
          logger.warn('DISCORD_WEBHOOK_URL not configured');
        }
      }
      // // If the event is neither an issue nor a pull request, send a generic message to Discord
      // if (process.env.DISCORD_WEBHOOK_URL) {
      //   const eventType = req.headers['x-github-event'] || 'unknown';
      //   const sender = payload.sender?.login || 'unknown';
      //   const message = `📢 Received GitHub event: **${eventType}** from **${sender}**\n[View Repository](${payload.repository?.html_url || '#'})`;

      //   logger.info(`Sending generic Discord notification for event: ${eventType}`);
      //   try {
      //     const response = await axios.post(process.env.DISCORD_WEBHOOK_URL, {
      //   content: message
      //     });
      //     logger.info(`Discord notification sent successfully, status: ${response.status}`);
      //   } catch (discordError) {
      //     logger.error('Failed to send generic Discord notification', discordError);
      //   }
      // } else {
      //   logger.warn('DISCORD_WEBHOOK_URL not configured');
      // }
      logger.info('Webhook processed successfully');
      return res.status(200).end();
    } catch (error) {
      logger.error('Error processing webhook', error);
      
      // Log detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        logger.error('Error response data:', error.response.data);
        logger.error('Error response status:', error.response.status);
        logger.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        logger.error('No response received from server', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        logger.error('Error setting up request:', error.message);
      }
      
      return res.status(500).json({
        error: 'Failed to process webhook',
        message: error.message
      });
    }
  }

  // Add a simple health check for GET requests
  if (req.method === 'GET') {
    logger.info('Health check request received');
    return res.status(200).json({
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }

  logger.warn(`Method not allowed: ${req.method}`);
  return res.status(405).json({ message: 'Method Not Allowed' });
}