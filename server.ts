// server.ts
import { MessageType, type WebSocketMessage, isJoystickMessage, type JoystickData } from './types.ts';
import { Hono } from 'hono';
import type { WSContext } from 'hono/ws';
import { serveStatic, upgradeWebSocket } from 'hono/deno';

function process_joystick(data: JoystickData) {
  const x = data.x ?? 0;
  const y = data.y ?? 0;
  const pressed = data.pressed ?? false;
  return {
    x,
    y,
    pressed: pressed,
  };
}

// Create a new Hono instance
const app = new Hono();

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

const clients = new Set<WSContext>();

app.get(
  '/ws',
  upgradeWebSocket((_c) => {
    console.log('[WEBSOCKET]: Incoming client connection...');
    return {
      onOpen(_event, ws) {
        console.log('[WEBSOCKET]: Opening new client connection...');
        clients.add(ws);
      },
      onMessage(event, ws) {
        console.log(`[WEBSOCKET]: Attemping to parse the message...`);
        try {
          const parsed_message = JSON.parse(event.data.toString()) as WebSocketMessage;

          switch (parsed_message.type) {
            case MessageType.Identify:
              break;
            case MessageType.Joystick:
              if (isJoystickMessage(parsed_message)) {
                const processed_data = process_joystick(parsed_message.data);
                console.log(
                  `[WEBSOCKET | ${parsed_message.client} | ${parsed_message.type} | ${parsed_message.timestamp}]: x: ${processed_data.x}, y: ${processed_data.y}, pressed: ${processed_data.pressed}`
                );
                console.log(`[WEBSOCKET]: Sending data to clients...`);
                for (const client of clients) {
                  if (client !== ws) {
                    client.send(JSON.stringify(processed_data));
                  }
                }
              }
              break;
            default:
              console.log(`[WEBSOCKET]: Unknown message type`);
              break;
          }
        } catch (error) {
          console.log(`[WEBSOCKET]: Error parsing message: ${error}`);
        }
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
Deno.serve({ port: 3000, hostname: '0.0.0.0' }, app.fetch);

// PRODUCTION SERVER
// Start the production server for Deno Deploy
// Deno.serve(app.fetch);
