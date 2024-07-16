// server.ts
import { MessageType, type WebSocketMessage, isJoystickMessage } from './types.ts';
import * as MQTT from 'mqtt';
import { Hono } from 'hono';
import type { WSContext } from 'hono/ws';
import { serveStatic, upgradeWebSocket } from 'hono/deno';

// Create a new Hono instance
const app = new Hono();

//  Create a new MQTT client
const mqtt = MQTT.connect('mqtt://3.137.214.188');

// Middleware to log the request method and URL
app.use(async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`[API Performance] ${c.req.method} ${c.req.url} -> ${duration} ms`);
});

app.use('/*', serveStatic({ root: './static' }));

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

const wsClients = new Set<WSContext>();

app.get(
  '/ws',
  upgradeWebSocket((_c) => {
    console.log('[WEBSOCKET]: Incoming client connection...');
    return {
      onOpen(_event, ws) {
        console.log('[WEBSOCKET]: Opening new client connection...');
        wsClients.add(ws);
      },
      onClose: (_event, ws) => {
        console.log('[WEBSOCKET]: Connection closed.');
        wsClients.delete(ws);
      },
      onError(event, ws) {
        console.log('[WEBSOCKET]: An error occurred. \n\t', JSON.stringify(event, null, 2));
        wsClients.delete(ws);
      },
    };
  })
);

function handleMessage(parsed_message: WebSocketMessage) {
  switch (parsed_message.type) {
    case MessageType.Identify:
      break;
    case MessageType.Joystick:
      if (isJoystickMessage(parsed_message)) {
        // console.log(
        //   `[${parsed_message.client} | ${parsed_message.type} | ${parsed_message.timestamp}]: x: ${parsed_message.data.x}, y: ${parsed_message.data.y}, pressed: ${parsed_message.data.s}`
        // );
        for (const client of wsClients) {
          client.send(JSON.stringify(parsed_message.data));
        }
      }
      break;
    default:
      console.log(`Unknown message type`);
      break;
  }
}

mqtt.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqtt.subscribe('joystick/data', (err) => {
    if (!err) {
      console.log('Subscribed to joystick/data topic');
    }
  });
});

mqtt.on('message', (_topic, message) => {
  // console.log(`Received message on topic ${topic}: ${message.toString()}`);
  try {
    const parsed_message = JSON.parse(message.toString()) as WebSocketMessage;
    handleMessage(parsed_message);
  } catch (error) {
    console.log(`Error parsing MQTT message: ${error}`);
  }
});

if (Deno.env.get('DENO_DEPLOYMENT_ID')) {
  Deno.serve(app.fetch);
} else {
  const port = 3000;
  Deno.serve({ port, hostname: '0.0.0.0' }, app.fetch);
}
