import {Hono} from 'hono'
import {PrismaClient} from'@prisma/client/edge'
import {withAccelerate} from '@prisma/extension-accelerate'
import {sign} from 'hono/jwt'
import { signupInput , signinInput } from "@lalitkumarbadhotiya/medium-common";


export const userRouter = new Hono<{
  Bindings:{
    DATABASE_URL :string
    JWT_SECRET: string
  }
}>()
///api/v1/user
//route 1 =========================================================
userRouter.post('/signup', async (c) =>{ 
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const {success} = signupInput.safeParse(body);
  if(!success){
    c.status(411)
    return c.json({message:"inputs not correct"})
  }
  try{
    const user = await prisma.user.create({
    data:{
      email: body.email,
      password: body.password
    }
  })
    const token = await sign({id : user.id},c.env.JWT_SECRET,'HS256');
    return c.json({jwt: token})
  }catch(e){
    c.status(411);
    return c.json({message:"Invalid"})
  }
  
})
//route 2 =========================================================
userRouter.post('/signin', async (c) =>{
  const body = await c.req.json();
  const {success} = signinInput.safeParse(body);
  if(!success){
    c.status(411)
    return c.json({message:"inputs not correct"})
  }
  const prisma = new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  
  try{
    const user = await prisma.user.findUnique({
    where:{
      email:body.email,
      password:body.password
    }
  })
  if(!user){
    c.status(403);
    return c.json({error:"user not found "})
  }
  const token = await sign({id : user.id},c.env.JWT_SECRET);
  return c.json({jwt: token})
  }catch(e){
    c.status(411);
    return c.json({message:"Invalid"})
  }
  
})
