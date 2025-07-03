import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { GenerateConsoleUrlRoute } from './endpoints';

// Start a Hono app
const app = new Hono();

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: '/docs',
});

// Register OpenAPI endpoints
openapi.get('/api/aws/console', GenerateConsoleUrlRoute);

// Export the Hono app
export default app;
