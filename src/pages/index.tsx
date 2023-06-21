import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import { useUser } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();
  if (!user) return null;

  console.log("user", user);

  return (<div className="flex w-full gap-3">
    <Image 
      src={user.profileImageUrl} 
      alt="Profile Image" 
      className="w-14 h-14 rounded-full" 
      width={56} 
      height={56}
    />
    <input placeholder="Type some emojis!" className="bg-transparent grow outline-none" />
  </div>);
}

// need the type of a "Post" from our API query for posts in "Home" component
// we use some helpers from the utils/api.ts file to determine this type
type PostWithUser = RouterOutputs["posts"]["getAll"][number]
const PostView = (props: PostWithUser) => {
  const {post, author} = props;

  console.log("author", author);

  return (
    <div key={post.id} className="flex p-4 border-b border-slate-400 gap-3">
      <Image 
        src={author.profileImageUrl} 
        alt="Profile image" 
        className="w-14 h-14 rounded-full" 
        width={56} 
        height={56}
      />
      <div className="flex flex-col">
        <div className="flex text-slate-300">
          <span>{`@${author.username}`} · <span className="font-thin">{`${dayjs(post.createdAt).fromNow()}`}</span></span>
        </div>
        <span>{post.content}</span>
      </div>
    </div>
  );
}

const Home: NextPage = () => {
  // const { user } = useUser();
  const { isLoaded, isSignedIn, user } = useUser();

  // tRPC lets you make server functions on vercel
  // fetch datas from database
  const { data, isLoading } = api.posts.getAll.useQuery();

  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>Something went wrong.</div>;

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center">
        <div className="h-full w-full md:max-w-2xl border-slate-400 border-x">
          {isSignedIn && <div className="border-b border-slate-400 p-4 flex justify">
            <div className="flex justify-center w-full">
              {/* <SignOutButton /> */}
              <CreatePostWizard />
            </div>
          </div>}
          <div className="flex flex-col">
            {data?.map((fullPost) => (
              <PostView {...fullPost} key={fullPost.post.id} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;