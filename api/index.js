// This file serves as the API root endpoint
export default function handler(req, res) {
  return res.status(200).json({
    name: "GitHub to Discord Notification Service",
    description: "Forwards GitHub webhook events to Discord",
    endpoints: {
      github: "/github - GitHub webhook endpoint"
    },
    usage: "Configure your GitHub repository webhook to send events to /github"
  });
}