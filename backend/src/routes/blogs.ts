import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { verify } from 'hono/jwt';

// Create a router with the necessary types
export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  },
  Variables: {
    userId: string;
  },
}>();

// Authentication middleware
blogRouter.use('/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: "unauthorized - invalid auth header" }, 401);
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    if (!payload.id) {
      return c.json({ error: "unauthorized - invalid token payload" }, 401);
    }
   await c.set('userId', payload.id);
    await next();
  } catch (error) {
    return c.json({ error: "unauthorized - invalid token" }, 401);
  }
});

// Create a new post
blogRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const body = await c.req.json();
    const post = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: userId
      }
    });
    return c.json({
      id: post.id
    });
  } catch (error) {
    console.log(error)
    return c.json({ error: "Error creating post" }, 500);
  }
});

// Update a post
blogRouter.put('/:id', async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const body = await c.req.json();
    const post = await prisma.post.update({
      where: {
        id: Number(id),
        authorId: Number(userId)
      },
      data: {
        title: body.title,
        content: body.content
      }
    });

    return c.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    return c.json({ error: "Error updating post" }, 500);
  }
});

blogRouter.get('/bulk', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());
  
  try {
    const posts = await prisma.post.findMany();
    return c.json(posts);
  } catch (error) {
    console.log(error)
    return c.json({ error: "Error fetching posts" }, 500);
  }
});

// Get a single post
blogRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());
  
  try {
    const post = await prisma.post.findUnique({
      where: {
        id: id
      }
    });

    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    return c.json(post);
  } catch (error) {
    return c.json({ error: "Error fetching post" }, 500);
  }
});

// Get all posts


export default blogRouter;