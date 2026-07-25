import {Hono} from 'hono'
import {PrismaClient} from'@prisma/client/edge'
import {withAccelerate} from '@prisma/extension-accelerate'
import {verify} from 'hono/jwt'
import { createblogInput, updateblogInput } from '@lalitkumarbadhotiya/medium-common'

export const blogRouter = new Hono<{
  Bindings:{
    DATABASE_URL :string
    JWT_SECRET: string
  },
  Variables:{
    userId: string
  }
}>()

type JwtPayload = {
  id: string;
};

blogRouter.use("/*", async (c, next) => {
  const header = c.req.header("authorization");

  if (!header) {
    return c.json(
      {
        error: "Unauthorized",
      },
      403
    );
  }

  try {
    const response = await verify(
      header,
      c.env.JWT_SECRET,
      "HS256"
    ) as JwtPayload;

    if (!response.id) {
      return c.json(
        {
          error: "Unauthorized",
        },
        403
      );
    }

    c.set("userId", response.id);

    await next();
  } catch (error) {
    return c.json(
      {
        error: "Unauthorized",
      },
      403
    );
  }
});

///api/v1/blog
//route 3 ==================================================
blogRouter.post('/', async (c) =>{ 
    const prisma = new PrismaClient({
        accelerateUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const {success} = createblogInput.safeParse(body);
      if(!success){
        c.status(411)
        return c.json({message:"inputs not correct"})
      }

    const blog = await prisma.post.create({
        data:{
            title: body.title,
            content: body.content,
            published: true,
            authorId: c.get("userId")
        }
    })
  return c.json({id : blog.id})
})
//route 4===================================================
blogRouter.put('/', async (c) => {
  const prisma = new PrismaClient({
        accelerateUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const {success} = updateblogInput.safeParse(body);
      if(!success){
        c.status(411)
        return c.json({message:"inputs not correct"})
      }
    const blog = await prisma.post.update({
        where:{
            id: body.id
        },
        data:{
            title: body.title,
            content: body.content,
        }
    })
  return c.json({id : blog.id})
})
//route 5 ==================================================
blogRouter.get('/bulk', async  (c) =>{
//todo add pagination 
    const prisma = new PrismaClient({
        accelerateUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    const all_blogs = await prisma.post.findMany({
      select:{
        content: true,
        title: true,
        id: true,
        author:{
          select:{
            name:true
          }
        }
      }
    })

    c.status(200)
  return c.json({all_blogs})
})

//route 6 ==================================================
//dont use body in a get request user headers/param
blogRouter.get('/:id', async (c) =>{
  const prisma = new PrismaClient({
        accelerateUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const id = c.req.param('id');
    try{
        const blog = await prisma.post.findFirst({
            where:{
                id
            },
            select:{
              id:true,
              title:true,
              content:true,
              author:{
                select:{
                  name:true
                }
              }
            }
        })
        return c.json(blog)
    }catch(e){
        c.status(411)
        return c.json({
            message: "request failed"
        })
    }
    
})

// https://backend.lalitkb.workers.dev