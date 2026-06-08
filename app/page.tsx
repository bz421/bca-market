import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SignOutButton from '@/app/components/sign-out-button';
import AddMarketButton from './components/add-market-button';
import SettingsButton from './components/settings-button';

function formatStringToCurrency(value: string): string {
  // console.log(`Input: ${value}`)
  const [whole, frac] = value.split('.');
  if (!frac) return `${whole}.00`;

  let cents = frac.slice(0, 2);
  const roundDigit = frac[2];

  if (roundDigit >= '5') {
    let value = BigInt(cents) + BigInt(1); // cents shouldn't overflow but just in case

    if (value === BigInt(100)) {
      return `${(BigInt(whole) + BigInt(1)).toString()}.00`;
    }

    return `${whole}.${value.toString().padStart(2, '0')}`;
  }

  return `${whole}.${cents}`;
}

function p(q: number[], b: number): number[] {
  const m = Math.max(...q);
  const denominator = q.reduce((sum, q_i) => sum + Math.exp((q_i - m) / b), 0);
  return q.map(q_i => Math.exp((q_i - m) / b) / denominator);
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  const user = session?.user

  if (!session) {
    redirect('/auth/signin');
  }

  const markets = await prisma.market.findMany({
    orderBy: [{ closeTime: 'asc' }, { createdAt: 'desc' }],
    include: {
      outcomes: {
        orderBy: { name: 'asc' },
      },
    },
  });

  for (const market of markets) {
    const q = market.outcomes.map((o) => o.sharesOutstanding);
    market.outcomes = market.outcomes.map((outcome, i) => ({
      ...outcome,
      price: p(q, market.liquidity)[i],
    }));
    // console.log(market.outcomes)
  }

  type OutcomeWithPrice = typeof markets[number]['outcomes'][number] & { price: number };


  // console.log(`Money: ${user?.money}, Formatted: ${formatStringToCurrency(user?.money?.toString() || '0.00')}`)

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

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-3">
              {/* Temporary location for Request Button */}
              <SettingsButton />
              <AddMarketButton />
              <SignOutButton />
            </div>
            <p className="mt-2 text-lg text-zinc-600">
              Your balance: <span className="font-mono font-semibold text-zinc-900">${formatStringToCurrency(user?.money?.toString() || '0.00')}</span>
            </p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {markets.length === 0 ? (
            <section className='rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-600'>
              No markets yet.
            </section>
          ) : (markets.map((market) => (market.status !== 'PENDING' || user?.id === market.creatorId.toString()) || user?.admin ? (
            <Link
              key={market.id}
              href={`/markets/${market.id}`}
              className="group flex h-min flex-col rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-zinc-950 group-hover:text-zinc-700">
                  {market.title}
                </h2>
                <div className="mt-3 space-y-1">
                  {(market.outcomes as OutcomeWithPrice[]).map((outcome, i) => (
                    <div className="flex items-center justify-between" key={outcome.id}>
                      <span key={outcome.id} className="mt-1 text-md text-zinc-900 font-medium truncate">
                        {outcome.name}
                      </span>
                      <span className="ml-2 text-sm text-zinc-900 font-semibold">
                        {`${(outcome.price * 100).toFixed(0)}%`}
                      </span>
                    </div>
                  ))}
                </div>

                {market.status === "PENDING" && (
                  <span className="rounded-full px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700">
                    Pending
                  </span>
                )}
              </div>
            </Link>
          ) : null))}
        </section>
      </main>
    </div>
  );
}