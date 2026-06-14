'use client';

import { useState } from "react";
import { Menu, X } from "lucide-react";
import SideNavContent from "./side-nav-content";

type Market = {
    id: number;
    title: string;
    status: string;
}

export default function MobileNav({
    visibleMarkets,
    currentMarketId,
    unreadCount
}: {
    visibleMarkets: Market[];
    currentMarketId?: number;
    unreadCount: number;
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="rounded-xl border border-zinc-200 bg-white p-2 shadow-sm xl:hidden cursor-pointer"
            >
                <Menu className="h-5 w-5 text-zinc-500" />
            </button>

            {open && (
                <>
                    <div className="fixed left-0 top-0 z-50 flex h-screen w-80 flex-col bg-white p-4 shadow-xl">
                        <div className="mb-3 flex justify-end">
                            <button
                                onClick={() => setOpen(false)}
                                className="rounded-lg p-2 hover:bg-zinc-100 cursor-pointer"
                            >
                                <X className="h-5 w-5 text-zinc-500" />
                            </button>
                        </div>

                        <SideNavContent
                            visibleMarkets={visibleMarkets}
                            currentMarketId={currentMarketId}
                            unreadCount={unreadCount}
                        />
                    </div>
                </>
            )}
        </>
    );
}