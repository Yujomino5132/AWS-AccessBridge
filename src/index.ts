import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { GenerateContactRoute } from './endpoints';

// Start a Hono app
const app = new Hono();

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: '/docs',
});

// Register OpenAPI endpoints
openapi.get('/api/contact', GenerateContactRoute);

// Export the Hono app
export default app;
