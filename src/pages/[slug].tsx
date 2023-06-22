import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { api } from "~/utils/api";
import { createServerSideHelpers } from '@trpc/react-query/server';
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import superjson from 'superjson';
import { PageLayout } from "../components/layout";

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
  const { data } = api.profile.getUserByUsername.useQuery({ 
    username,
  });

  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        <div className="relative h-36 bg-slate-600">
          <Image 
            src={data.profileImageUrl} 
            alt={`${data.username ?? ""}'s profile picture`}
            width={128}
            height={128}
            className="absolute bottom-0 left-0 -mb-[64px] rounded-full border-4 border-black ml-4"
          />
        </div>
        <div className="h-[64px]"></div>
        <div className="p-4 text-2xl font-bold">
          {`@${data.username ?? ""}`}
        </div>
        <div className="border-b w-full border-slate-400"></div>
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson, // optional - adds superjson serialization
  });

  const slug = context.params?.slug;
  if (typeof slug !== "string") throw new Error("no slug");

  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      // dehydrate - ssg helpers in tRPC. it takes all the things we fetched, puts in a shape parsed by Next.js server side props
      // then on app side, we wrap with tRPC, data hydrated thru react-query. so data is there when page loads, and 'isLoading' will
      // never be hit.
      trpcState: ssg.dehydrate(),
      username
    }
  }
};

// need static paths to use static props
export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" }
}

export default ProfilePage;