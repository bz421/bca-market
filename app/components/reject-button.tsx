'use client'

import { useRouter } from "next/navigation"
import { Market } from "../generated/prisma/browser"

async function handleReject(market: Market) {
    const response = await fetch("/api/markets", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ marketId: market.id }),
    })

    if (!response.ok) {
        console.error("Failed to reject market");
        return false;
    }

    return true;
}

export default function RejectButton({ market }: { market: Market }) {
    const router = useRouter()

    return (
        <button 
            className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 cursor-pointer" 
            onClick={async () => {
                const rejected = await handleReject(market)

                if (!rejected) {
                    return
                }

                router.refresh()
                router.push("/")
            }}
        >
            Reject
        </button>
    )
}