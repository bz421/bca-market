'use client'

import { useState } from "react";
import { useRouter } from "next/navigation"
import { Market } from "../generated/prisma/browser"
import { deleteMarket } from '@/app/actions/deleteMarket';

export default function RejectButton({ market }: { market: Market }) {
    const router = useRouter()
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <>
            <button
                className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 cursor-pointer"
                onClick={() => setOpen(true)}
            >
                Reject
            </button>

            {open && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 z-50">
                    <div className="bg-white p-6 rounded-lg">
                        <h2 className="text-xl text-zinc-950 font-semibold mb-4">Confirm Rejection</h2>
                        <p className="text-zinc-600 mb-4">
                            Are you sure you want to reject this market?
                        </p>
                        
                        <div className="mb-6">
                            <label className="mb-1 block text-sm font-medium text-zinc-700">
                                Message (Optional)
                            </label>
                            <textarea
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                                className="min-h-20 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900 text-sm"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                className="rounded-lg bg-zinc-200 px-4 py-2 text-zinc-700 hover:bg-zinc-300 cursor-pointer"
                                onClick={() => {
                                    setOpen(false);
                                    setMessage("");
                                }}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled={isSubmitting}
                                onClick={async () => {
                                    setIsSubmitting(true);
                                    try {
                                        await deleteMarket(market, message.trim() || undefined);
                                        setOpen(false);
                                        router.refresh();
                                        router.push("/");
                                    } catch (err) {
                                        console.error(err);
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                            >
                                {isSubmitting ? "Rejecting..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}