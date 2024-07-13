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
  upgradeWebSocket((_c) => {
    console.log('[WEBSOCKET SERVER] Incoming client connection...');
    return {
      onOpen(_event, ws) {
        console.log('[WEBSOCKET SERVER] Connection opened.');
        ws.send('[ArDeno API] Websocket connection established.');
      },
      onMessage(event, ws) {
        const messageStart = Date.now();
        console.log(`[WEBSOCKET SERVER] Message from client: ${event.data}`);
        ws.send('[ArDeno API] Message received.');
        const messageDuration = Date.now() - messageStart;
        console.log(`[WEBSOCKET SERVER] Performance -- Processing message in Deno took ${messageDuration} ms`);
      },
      onClose: (_event, ws) => {
        console.log('[WEBSOCKET SERVER] Connection closed.');
        ws.send('[ArDeno API] Closing connection...');
      },
    };
  })
);

// Start the local development server
// Deno.serve({ port: 3000, hostname: '0.0.0.0' }, app.fetch);
// Start the production server for Deno Deploy
Deno.serve(app.fetch);
