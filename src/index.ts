import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { GenerateConsoleUrlRoute, AssumeRoleRoute } from './endpoints';

// Start a Hono app
const app = new Hono();

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: '/docs',
});

// Register OpenAPI endpoints
openapi.post('/api/aws/console', GenerateConsoleUrlRoute);
openapi.post('/api/aws/assume-role', AssumeRoleRoute);

// Export the Hono app
export default app;
