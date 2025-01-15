"use client";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const userId = session?.user.id;
  console.log(userId);
  return (
    <div className="min-h-screen flex-col w-full bg-white flex items-center justify-center">
      <div className="text-black bg-sky-400 px-4 py-1 text-xl font-bold rounded-lg shadow-md">
        {session?.user.name}
      </div>
      <span className="text-black">
        LoggedIn user&apos;s Id: {userId}
      </span>
    </div>
  );
}
