import { type NextPage } from "next";
import Image from "next/image";
import { api } from "~/utils/api";
import { useUser } from "@clerk/nextjs";
import { LoadingPage, LoadingSpinner } from "../components/loading";
import { PageLayout } from "../components/layout";
import { PostView } from "../components/postview";
import { useState } from "react";
import { toast } from "react-hot-toast";
// import { SignOutButton } from "@clerk/nextjs";

const CreatePostWizard = () => {
  const { user } = useUser();

  // rerendering on every key press, far from ideal
  // much better to use something like https://www.react-hook-form.com/
  const [input, setInput] = useState(""); 

  // tRPC stuff
  // grab whole tRPC cache through api context call
  const ctx = api.useContext();
  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      // void tells TypeScript we don't care that it's async we just wanna run it in bg
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;

      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to post! Please try again later.")
      }
    }
  });

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
    <input 
      placeholder="Type some emojis!" 
      className="bg-transparent grow outline-none"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => { 
        if (e.key === "Enter") {
          e.preventDefault();
          if (input !== "") {
            mutate({ content: input });
          }
        }
      }}
      disabled={isPosting}
    />
    {input !== "" && !isPosting && 
    (<button onClick={() => mutate({ content: input })}>Post</button>)}

    {isPosting && (
      <div className="flex items-center justify-center">
        <LoadingSpinner size={20} />
      </div>
    )}
  </div>);
}

const Feed = () => {
  // tRPC lets you make server functions on vercel
  // fetch datas from database
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;
  if (!data) return <div>Something went wrong.</div>;

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
}

const Home: NextPage = () => {
  const { isSignedIn, isLoaded: userLoaded } = useUser();

  // start fetching asap (react query only fetches once and starts caching)
  const { data } = api.posts.getAll.useQuery();

  // return empty div if user isn't loaded
  if (!userLoaded) return <div />;

  return (
    <>
      <PageLayout>
        <div className="flex border-b border-slate-400 p-4">
          {isSignedIn && <div className="flex justify-center w-full">
            {/* <SignOutButton /> */}
            <CreatePostWizard />
          </div>}
        </div>

        <Feed />
      </PageLayout>
    </>
  );
};

export default Home;