import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AddMarketButton from './components/add-market-button';
import SettingsButton from './components/settings-button';
import PortfolioButton from './components/portfolio-button';
import MarketCard from "./components/market-card";
import TopNav from './components/top-nav';
import SideNav from './components/side-nav';
import { getNormalizedStatus } from '@/lib/market-status';
import MobileNav from './components/mobile-nav';
import { getUnreadNotifCount } from '@/lib/notifications';

import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Markets' }


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

  if (!session || !session.user?.email) {
    redirect('/auth/signin');
  }

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  const dbMarkets = await prisma.market.findMany({
    where: {
      OR: [
        { status: { not: 'RESOLVED' } },
        { resolvedAt: { gte: twoDaysAgo } }
      ]
    },
    orderBy: [{ closeTime: 'asc' }, { createdAt: 'desc' }],
    include: {
      outcomes: {
        orderBy: { name: 'asc' },
      },
    },
  });

  const markets = dbMarkets.map(market => ({
    ...market,
    status: getNormalizedStatus(market.status, market.closeTime)
  }));

  for (const market of markets) {
    const q = market.outcomes.map((o) => o.sharesOutstanding);
    market.outcomes = market.outcomes.map((outcome, i) => ({
      ...outcome,
      price: p(q, market.liquidity)[i],
    }));
    // console.log(market.outcomes)
  }

  type OutcomeWithPrice = typeof markets[number]['outcomes'][number] & { price: number };

  const visibleMarkets = markets.filter((market) => {
    if (market.status !== 'PENDING') return true;
    if (user?.admin) return true;
    return user?.id === market.creatorId.toString();
  });

  const unreadCount = await getUnreadNotifCount(session.user.email);

  // const openMarkets = visibleMarkets.filter((market) => market.status === 'OPEN');
  // const pendingMarkets = visibleMarkets.filter((market) => market.status === 'PENDING');
  // const resolvedMarkets = visibleMarkets.filter((market) => market.status === 'RESOLVED');

  // console.log(`Money: ${user?.money}, Formatted: ${formatStringToCurrency(user?.money?.toString() || '0.00')}`)

  return (
    <div className="min-h-screen bg-zinc-50">
      <TopNav mobileMenu={<MobileNav visibleMarkets={visibleMarkets} unreadCount={unreadCount} />} />

      <main className="mx-auto grid w-full grid-cols-1 gap-6 px-8 pt-4 pb-8 xl:grid-cols-[260px_minmax(0,1fr)]">
        <SideNav unreadCount={unreadCount} />

        <section className="flex min-w-0 flex-col gap-6">
          <header className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-zinc-500">
                  Hello, {session.user?.firstName || session.user?.email?.split("@")[0]}!
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
                  Welcome back.
                </h1>

                <p className="mt-2 max-w-2xl text-zinc-600">
                  Browse active BCA prediction markets, track outcomes, and request new markets.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 md:items-end">
                <div className="rounded-2xl bg-zinc-50 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                    Balance
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold text-zinc-950">
                    ${formatStringToCurrency(user?.money?.toString() || '0.00')}
                  </p>
                </div>

                <div className="flex flex-row items-center gap-2">
                  <PortfolioButton />
                  <SettingsButton unreadCount={unreadCount} />
                  <AddMarketButton />
                </div>
              </div>
            </div>
          </header>

          {/* <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                Open markets
              </p>
              <p className="mt-2 text-2xl font-bold text-zinc-950">
                {openMarkets.length}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                Pending
              </p>
              <p className="mt-2 text-2xl font-bold text-zinc-950">
                {pendingMarkets.length}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                Recently resolved
              </p>
              <p className="mt-2 text-2xl font-bold text-zinc-950">
                {resolvedMarkets.length}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                Total visible
              </p>
              <p className="mt-2 text-2xl font-bold text-zinc-950">
                {visibleMarkets.length}
              </p>
            </div>
          </section> */}

          <section>

            {visibleMarkets.length === 0 ? (
              <section className="rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-600">
                No markets yet.
              </section>
            ) : (
                <div className="columns-1 md:columns-2 xl:columns-3 2xl:columns-4 gap-6">
                {visibleMarkets.map((market) => (
                  <div key={market.id} className="break-inside-avoid mb-6">
                    <MarketCard
                      key={market.id}
                      market={{
                        id: market.id,
                        title: market.title,
                        status: market.status,
                        closeTime: market.closeTime.toISOString(),
                        resolvedOutcomeId: market.resolvedOutcomeId,
                        outcomes: (market.outcomes as OutcomeWithPrice[]).map((outcome) => ({
                          id: outcome.id,
                          name: outcome.name,
                          price: outcome.price,
                        })),
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}