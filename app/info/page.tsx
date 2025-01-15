"use client";

import { useRouter } from "next/navigation";

export default function InfoPage() {
  const router = useRouter();
  return (
    <div className="bg-white flex flex-col items-center justify-center min-h-screen w-full">
      <span className="text-4xl font-bold text-black">
        Welcome to Pulse...!
      </span>
      <button className="border px-2 py-1 text-black border-black rounded-lg"
        onClick={() => {
          router.push("/auth/signin");
        }}
      >
        Login
      </button>
    </div>
  );
}
