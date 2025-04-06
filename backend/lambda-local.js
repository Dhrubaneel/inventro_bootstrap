import { handler } from './lambda.js';
import { createServer } from 'http';

const server = createServer(async (req, res) => {
    if (req.method === 'POST') {
      let body = '';
  
      // Collect request data
      req.on('data', chunk => {
        body += chunk.toString();
      });
  
      req.on('end', async () => {
        try {
          // Parse the request body as JSON
          const event = JSON.parse(body);
  
          // Call the Lambda handler function
          const result = await handler(event);
  
          // Send the response
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error) {
          // Handle errors
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    } else {
      // Handle unsupported HTTP methods
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
    }
  });
  
  // Start the server
  const PORT = 3000;
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });