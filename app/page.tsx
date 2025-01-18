"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user.id;
  console.log(userId);
  return (
    <div className="min-h-screen flex-col w-full bg-white flex items-center justify-center">
      <div className="text-black bg-sky-400 px-4 py-1 text-xl font-bold rounded-lg shadow-md">
        {session?.user.name}
      </div>
      <div className="flex flex-col items-center">
        <p className="text-black text-xl mt-4">
          Welcome to Pulse, a chat-app built with NextJs and socket-io...!
        </p>
        <button
          onClick={() => {
            router.push("/chat");
          }}
          className="text-white mt-4 bg-amber-500 w-1/2  border px-4 py-1 rounded-lg"
        >
          Click me to have a chat 👆
        </button>
      </div>
    </div>
  );
}
