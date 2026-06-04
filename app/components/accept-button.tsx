'use client'

import { useRouter } from "next/navigation"
import { Market } from "../generated/prisma/browser"
import { acceptMarket } from '@/app/actions/acceptMarket';

export default function AcceptButton({ market }: { market: Market }) {
    const router = useRouter();

    return (
        <button className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600 cursor-pointer"
            onClick={async () => {
                await acceptMarket(market.id)

                router.refresh()
                router.push(`/markets/${market.id}`)
            }}>
            Accept
        </button>
    )
}