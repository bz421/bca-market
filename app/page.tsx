'use client'

import { signOut, useSession } from 'next-auth/react';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome!
          </h1>
          <div className="max-w-xs text-lg leading-7 text-gray-600 dark:text-gray-400">
            <p>
              Hello, {session?.user.firstName} {session?.user.lastName}!
            </p>
            <p>
              You are logged in as {session?.user.email}. 
            </p>
            <p>
              Money: {session?.user.money}
            </p>
            </div>
        </div>
        <button className="mt-10 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 cursor-pointer" 
          onClick={() => signOut()}>
          Log out
        </button>
      </main>
    </div>
  );
}
