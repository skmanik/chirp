import Link from "next/link";
import Image from "next/image";
import type { RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

// need the type of a "Post" from our API query for posts in "Home" component
// we use some helpers from the utils/api.ts file to determine this type
type PostWithUser = RouterOutputs["posts"]["getAll"][number]
export const PostView = (props: PostWithUser) => {
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
        <div className="flex gap-1 text-slate-300">
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username}`}</span>
          </Link>
          <Link href={`/post/${post.id}`}>
            <span className="font-thin">
              {`· ${dayjs(post.createdAt).fromNow()}`}
            </span>
          </Link>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  );
}
