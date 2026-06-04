import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SignOutButton from '@/app/components/sign-out-button';
import AddMarketButton from './components/add-market-button';
import SettingsButton from './components/settings-button';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const markets = await prisma.market.findMany({
    orderBy: [{ closeTime: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex items-start justify-between gap-6 rounded-2xl bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm text-zinc-500">
              Hello, {session.user?.firstName}!
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-950">
              Welcome to BCA Market!
            </h1>
            <p className="mt-2 text-zinc-600">
              You are logged in as {session.user?.email}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Temporary location for Request Button */}
            <SettingsButton />
            <AddMarketButton />
            <SignOutButton />
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {markets.length === 0 ? (
            <section className='rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-600'>
              No markets yet.
            </section>
          ) : (markets.map((market) => (
            <Link
              key={market.id}
              href={`/markets/${market.id}`}
              className="group flex aspect-square flex-col rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-zinc-950 group-hover:text-zinc-700">
                  {market.title}
                </h2>
                <p className="mt-3 line-clamp-5 text-sm leading-6 text-zinc-600">
                  {market.description}
                </p>
              </div>
            </Link>
          )))}
        </section>
      </main>
    </div>
  );
}