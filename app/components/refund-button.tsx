'use client'

import { useState } from "react";
import { useRouter } from "next/navigation"
import { Market } from "../generated/prisma/browser"
import { refundMarket } from '@/app/actions/refundMarket';

export default function RefundButton({ market }: { market: Market }) {
    const router = useRouter()
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 cursor-pointer"
                onClick={() => setOpen(true)}
            >
                Refund
            </button>

            {open && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 z-50">
                    <div className="bg-white p-6 rounded-lg">
                        <h2 className="text-xl text-zinc-950 font-semibold mb-4">Confirm Refund</h2>
                        <p className="text-zinc-600 mb-4">
                            Are you sure you want to refund this market?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                className="rounded-lg bg-zinc-200 px-4 py-2 text-zinc-700 hover:bg-zinc-300 cursor-pointer"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 cursor-pointer"
                                onClick={async () => {
                                    await refundMarket(market)
                                    router.refresh()
                                    router.push("/")
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}