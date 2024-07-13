import { Hono } from 'hono';

// Create a new Hono instance
const app = new Hono();

// Add routes
app.get('/', (c) => c.text('Arduino Web Application'));
app.get('/api', (c) => {
  return c.json({
    ok: true,
    message: 'Arduino Web API',
  });
});

// Start the server
Deno.serve(app.fetch);
