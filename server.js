const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// This script will ignore any command-line port arguments.
// The port is hardcoded to 5000 to match the ngrok tunnel.
const PORT = 5000;
const HOSTNAME = '0.0.0.0'; // Listen on all network interfaces

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    // The 'parse' function from 'url' is robust and handles all URL formats.
    // The second argument 'true' parses the query string.
    const parsedUrl = parse(req.url, true);
    
    // Pass the request to the Next.js handler.
    // This is the standard way to handle requests in a custom server.
    handle(req, res, parsedUrl);
  }).listen(PORT, HOSTNAME, (err) => {
    if (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
    console.log(`> Ready on http://${HOSTNAME}:${PORT}`);
  });
}).catch(err => {
    console.error('Error preparing Next.js app:', err);
    process.exit(1);
})
