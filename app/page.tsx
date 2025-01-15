"use client";
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function Home() {
  const { data: session } = useSession();
  const userId = session?.user.id;
  console.log(userId);
  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <span className="text-black">
        LoggedIn user's Id:
        {userId}
      </span>
    </div>
  );
}
