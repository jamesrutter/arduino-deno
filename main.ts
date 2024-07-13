// main.ts
import { Hono } from 'hono';
import { serveStatic, upgradeWebSocket } from 'hono/deno';

// Create a new Hono instance
const app = new Hono();

// Middleware to log the request method and URL
app.use(async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`[API Performance] ${c.req.method} ${c.req.url} -> ${duration} ms`);
});

app.use('/', serveStatic({ path: './static/index.html' }));

// LANDING PAGE
app.get('/', (c) => {
  console.log('GET /');
  return c.render('Hello, World!');
});

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
  upgradeWebSocket((c) => {
    console.log('Incoming WebSocket connection');
    console.log('Request:', JSON.stringify(c.req, null, 2));

    return {
      onOpen(event, ws) {
        console.log('WebSocket connection opened');
        console.log('Event:', JSON.stringify(event, null, 2));
        console.log('WebSocket:', JSON.stringify(ws, null, 2));
        ws.send('Welcome to the WebSocket server!');
      },
      onMessage(event, ws) {
        console.log(`Message from client: ${event.data}`);
        console.log('Event:', JSON.stringify(event, null, 2));
        console.log('WebSocket:', JSON.stringify(ws, null, 2));
        ws.send('Hello from server!');
      },
      onClose: () => {
        console.log('Connection closed');
      },
    };
  })
);

// Start the server
Deno.serve(app.fetch);
