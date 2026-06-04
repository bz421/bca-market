'use client'

import { useRouter } from "next/navigation"
import { Market } from "../generated/prisma/browser"
import { deleteMarket } from '@/app/actions/deleteMarket';

export default function RejectButton({ market }: { market: Market }) {
    const router = useRouter()

    return (
        <button
            className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 cursor-pointer"
            onClick={async () => {
                await deleteMarket(market.id)

                router.refresh()
                router.push("/")
            }}
        >
            Reject
        </button>
    )
}