'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import Link from 'next/link';

export interface UpdateCardItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

/**
 * Format:
 *  id: unique string to track if a user has seen it
 *  title: headline text
 *  content: string or jsx
 */
export const UPDATE_CARDS: UpdateCardItem[] = [
  {
    id: 'welcome-2026',
    title: 'Welcome to BCA Market!',
    content: (
      <>
        Welcome to the 2026-2027 school year! If you have any questions, need assistance,
        or would like to report a concern regarding a market,
        please feel free to contact us at{' '}
        <a href="mailto:bcamarketsupport@gmail.com" className="text-blue-600 hover:underline">
          bcamarketsupport@gmail.com
        </a>.
      </>
    ),
  },
  {
    id: 'november-2026',
    title: 'Happy November!',
    content: (
      <>
        Happy November BCA Market! Stipends have been paid out to all users with a net worth below $6000. 
      </>
    ),
  },

];

const DISMISSED_CARDS_KEY = 'dismissed_update_cards';
const LEGACY_KEY = 'banner_dismissed';

function getDismissedCardIds(): Set<string> {
  const dismissed = new Set<string>();

  // check legacy key for backward compatibility
  if (typeof window !== 'undefined' && localStorage.getItem(LEGACY_KEY) === 'true') {
    dismissed.add('welcome-2026');
  }

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(DISMISSED_CARDS_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => dismissed.add(String(id)));
      }
    }
  } catch {

  }

  return dismissed;
}

function persistDismissedCard(id: string) {
  try {
    const dismissed = getDismissedCardIds();
    dismissed.add(id);
    localStorage.setItem(DISMISSED_CARDS_KEY, JSON.stringify(Array.from(dismissed)));
    localStorage.setItem(LEGACY_KEY, 'true');
  } catch {

  }
}

export default function UpdateBanner() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [unseenCards, setUnseenCards] = useState<UpdateCardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // don't show on auth page
    if (status !== 'authenticated' || !session?.user || pathname?.startsWith('/auth')) {
      return;
    }

    const dismissed = getDismissedCardIds();
    const pending = UPDATE_CARDS.filter((card) => !dismissed.has(card.id));

    if (pending.length > 0) {
      setUnseenCards(pending);
      setCurrentIndex(0);
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [status, session, pathname]);

  useEffect(() => {
    const handleOpenChangelog = () => {
      setUnseenCards(UPDATE_CARDS);
      setCurrentIndex(0);
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 50);
      return () => clearTimeout(timer);
    };

    window.addEventListener('open-changelog', handleOpenChangelog);
    return () => {
      window.removeEventListener('open-changelog', handleOpenChangelog);
    };
  }, []);

  if (unseenCards.length === 0) return null;

  const currentCard = unseenCards[currentIndex];
  if (!currentCard) return null;

  const isLastCard = currentIndex >= unseenCards.length - 1;
  const hasMultiple = unseenCards.length > 1;

  const closeBanner = () => {
    setIsOpen(false);
    setTimeout(() => {
      setUnseenCards([]);
    }, 400);
  };

  const handleDismissCurrent = () => {
    persistDismissedCard(currentCard.id);

    if (!isLastCard) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      closeBanner();
    }
  };

  const handleDismissAll = () => {
    unseenCards.forEach((card) => persistDismissedCard(card.id));
    closeBanner();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-zinc-950/25 backdrop-blur-xs transition-opacity duration-400 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      />

      <div className="fixed top-4 sm:top-8 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-2xl rounded-lg border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-2xl transition-all duration-500 ease-out ${isOpen
            ? 'translate-y-0 opacity-100 scale-100'
            : '-translate-y-20 opacity-0 scale-95'
            }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div key={currentCard.id} className="w-full">
                <h2 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
                  {currentCard.title}
                </h2>
                <div className="mt-2 text-sm sm:text-base leading-relaxed text-zinc-600">
                  {currentCard.content}
                </div>
              </div>
            </div>

            <button
              onClick={handleDismissAll}
              type="button"
              aria-label="Dismiss message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 pt-6 border-t border-zinc-100 mt-4">
            {hasMultiple ? (
              <div className="flex items-center gap-1.5">
                {unseenCards.map((card, idx) => (
                  <span
                    key={card.id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex
                      ? 'w-6 bg-zinc-950'
                      : idx < currentIndex
                        ? 'w-1.5 bg-zinc-400'
                        : 'w-1.5 bg-zinc-200'
                      }`}
                  />
                ))}
                <span className="text-xs text-zinc-400 ml-2 font-medium">
                  {currentIndex + 1} of {unseenCards.length}
                </span>
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleDismissCurrent}
                type="button"
                className="rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer"
              >
                {isLastCard ? 'Dismiss' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
