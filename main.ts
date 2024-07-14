// main.ts
import type { WSContext } from 'hono/ws';
import { Hono } from 'hono';
import { serveStatic, upgradeWebSocket } from 'hono/deno';

const udpSocket = Deno.listenDatagram({
  hostname: '0.0.0.0',
  port: 8000,
  transport: 'udp',
});

console.log('UDP server listening on port 8000');

// Function to handle UDP messages
async function handle_udp() {
  for await (const [data, _remoteAddr] of udpSocket) {
    const message = new TextDecoder().decode(data);
    console.log('Received UDP message:', message);

    try {
      const parsed_message = JSON.parse(message);
      if (parsed_message.type === 'joystick') {
        // Broadcast to all WebSocket clients
        for (const client of clients) {
          client.send(JSON.stringify(parsed_message.data));
        }
      }
    } catch (error) {
      console.error('Error parsing UDP message:', error);
    }
  }
}

// Create a new Hono instance
const app = new Hono();

const clients = new Set<WSContext>();

// Middleware to log the request method and URL
app.use(async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`[API Performance] ${c.req.method} ${c.req.url} -> ${duration} ms`);
});

// Serve static files from the "static" directory
app.use('/*', serveStatic({ root: './static' }));

// Serve the HTML file for the joystick demo
app.use('/', serveStatic({ path: './static/index.html' }));

// API ROUTES
app.get('/api', (c) => {
  console.log('GET /api');
  return c.json({
    ok: true,
    message: 'Arduino Web API',
  });
});

app.post('/api/:sensor', async (c) => {
  console.log('POST /api/:sensor');

  const sensor = c.req.param('sensor');
  console.log(`\t Sensor: ${sensor}`);

  // Get the body and the value from the sensor reading
  const { value } = await c.req.json();
  const temperature = parseFloat(value);

  return c.json({
    ok: true,
    message: 'Received sensor reading and saved to the database.',
    sensor,
    temperature,
  });
});

app.get('/api/:sensor', (c) => {
  console.log('GET /api/:sensor');
  const sensor = c.req.param('sensor');
  console.log(`\t Sensor: ${sensor}`);

  return c.json({
    ok: true,
    message: 'Arduino Web API',
    sensor,
  });
});

app.get(
  '/ws',
  upgradeWebSocket((_c) => {
    return {
      onOpen(_event, ws) {
        console.log(`[WEBSOCKET]: Client connected`);
        clients.add(ws);
      },
      onMessage(_event, _ws) {
        console.log('[WEBSOCKET]: Received message');
      },
      onClose: (_event, ws) => {
        console.log('[WEBSOCKET]: Connection closed.');
        clients.delete(ws);
      },
      onError(event, ws) {
        console.log('[WEBSOCKET]: An error occurred. \n\t', JSON.stringify(event, null, 2));
        clients.delete(ws);
      },
    };
  })
);

// LOCAL DEVELOPMENT SERVER
// Start the local development server
// Deno.serve({ port: 3000, hostname: '0.0.0.0' }, app.fetch);

// PRODUCTION SERVER
// Start the production server for Deno Deploy
Deno.serve(app.fetch);

handle_udp();
