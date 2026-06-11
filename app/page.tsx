import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SignOutButton from '@/app/components/sign-out-button';
import AddMarketButton from './components/add-market-button';
import SettingsButton from './components/settings-button';
import PortfolioButton from './components/portfolio-button';
import MarketCard from "./components/market-card";

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
  
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const markets = await prisma.market.findMany({
    where: {
      OR: [
        { status: {not: 'RESOLVED'} },
        { resolvedAt: { gte: sevenDaysAgo } }
      ]
    },
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
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-8 py-10">
        <header className="flex items-start justify-between gap-6 rounded-2xl bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm text-zinc-500">
              Hello, {session.user?.firstName || session.user?.email?.split("@")[0]}!
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
              <PortfolioButton />
              <AddMarketButton />
              <SignOutButton />
            </div>
            <p className="mt-2 text-lg text-zinc-600">
              Your balance: <span className="font-mono font-semibold text-zinc-900">${formatStringToCurrency(user?.money?.toString() || '0.00')}</span>
            </p>
          </div>
        </header>

        <section className="grid auto-rows-fr justify-start gap-6 [grid-template-columns:repeat(auto-fill,360px)]">
          {markets.length === 0 ? (
            <section className='rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-600'>
              No markets yet.
            </section>
          ) : (markets.map((market) => (market.status !== 'PENDING' || user?.id === market.creatorId.toString()) || user?.admin ? (
            <MarketCard
              key={market.id}
              market={{
                id: market.id,
                title: market.title,
                status: market.status,
                closeTime: market.closeTime.toISOString(),
                outcomes: (market.outcomes as OutcomeWithPrice[]).map((outcome) => ({
                  id: outcome.id,
                  name: outcome.name,
                  price: outcome.price,
                })),
              }}
            />
          ) : null))}
        </section>
      </main>
    </div>
  );
}