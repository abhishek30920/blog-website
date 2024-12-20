// app.ts
import { Hono } from 'hono';

import { userRouter } from './routes/user';
import { blogRouter } from './routes/blogs';

// Define the base Hono app with environment bindings
export const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  },
}>();

// Register routes - using v2 to match the blog router implementation
app.route('/api/v2/blog', blogRouter);
app.route('/api/v1/user', userRouter);

export default app;