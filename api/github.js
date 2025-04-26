// Import axios using dynamic import to ensure compatibility with Vercel
let axios;
import('axios').then(module => {
  axios = module.default;
}).catch(err => {
  console.error('Error importing axios:', err);
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const payload = req.body;

      // Handle issue events
      if (payload.issue) {
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
        
        // Send notification to Discord
        if (process.env.DISCORD_WEBHOOK_URL && message) {
          await axios.post(process.env.DISCORD_WEBHOOK_URL, {
            content: message
          });
        } else if (!process.env.DISCORD_WEBHOOK_URL) {
          console.warn('DISCORD_WEBHOOK_URL not configured');
        }
      }
      
      // Handle pull request events
      if (payload.pull_request) {
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
        
        // Send notification to Discord
        if (process.env.DISCORD_WEBHOOK_URL && message) {
          await axios.post(process.env.DISCORD_WEBHOOK_URL, {
            content: message
          });
        } else if (!process.env.DISCORD_WEBHOOK_URL) {
          console.warn('DISCORD_WEBHOOK_URL not configured');
        }
      }

      return res.status(200).end();
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({ error: 'Failed to process webhook' });
    }
  }

  // Add a simple health check for GET requests
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok' });
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}