import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { GenerateConsoleUrlRoute, AssumeRoleRoute, ListAssumablesRoute, GetCurrentUserRoute } from './endpoints';

// Start a Hono app
const app = new Hono();

// Add CORS middleware
app.use('*', cors());

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: '/docs',
});

// Register OpenAPI endpoints
openapi.post('/api/aws/console', GenerateConsoleUrlRoute);
openapi.post('/api/aws/assume-role', AssumeRoleRoute);
openapi.get('/api/user/assumables', ListAssumablesRoute);
openapi.get('/api/user/me', GetCurrentUserRoute);

// Export the Hono app
export default app;
