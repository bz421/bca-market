'use client'

import { useRouter } from "next/navigation"
import { Market } from "../generated/prisma/browser"
import { refundMarket } from '@/app/actions/refundMarket';

export default function RefundButton({ market }: { market: Market }) {
    const router = useRouter()

    return (
        <button
            className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 cursor-pointer"
            onClick={async () => {
                await refundMarket(market)

                router.refresh()
                router.push("/")
            }}
        >
            Refund
        </button>
    )
}