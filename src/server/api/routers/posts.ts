import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";
import type { Post } from "@prisma/client";

const addUserDataToPosts = async (posts: Post[]) => {
  // using clerk client to fetch users data
  const users = (
    await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    })
  ).map(filterUserForClient);

  console.log(users);

  // returning posts and matching with an author from users data
  return posts.map((post) => {
    const author = users.find((user) => user.id === post.authorId);

    if (!author || !author.username) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Author for post not found"
      });
    }
    
    return {
      post,
      author: {
        ...author,
        username: author.username
      }
    }
  });
}

// create a ratelimiter that allows 3 req per 1 m
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true
})

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }],
    });

    return addUserDataToPosts(posts);
  }),

  getPostsByUserId: publicProcedure.input(z.object({
    userId: z.string()
  })).query(({ ctx, input}) => ctx.prisma.post.findMany({
    where: {
      authorId: input.userId
    }, 
    take: 100,
    orderBy: [{ createdAt: "desc" }]
  }).then(addUserDataToPosts)
  ),

  // using ZOD to validate that the post uses a string
  create: privateProcedure.input(z.object({
    content: z.string().emoji("Only emojis are allowed").min(1).max(280)
  })).mutation(async ({ ctx, input }) => {
    const authorId = ctx.userId;
    const { success } = await ratelimit.limit(authorId);

    if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" })

    const post = await ctx.prisma.post.create({
      data: {
        authorId,
        content: input.content,
      },
    });

    return post;
  }),
});