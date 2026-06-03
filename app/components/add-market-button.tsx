"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function RequestMarketButton() {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [closeTime, setCloseTime] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        const response = await fetch("/api/markets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title,
                description,
                closeTime,
            }),
        });

        if (!response.ok) {
            const data = (await response.json().catch(() => null)) as
                | { error?: string }
                | null;

            setError(data?.error ?? "Failed to submit market request.");
            return;
        }

        startTransition(() => {
            setOpen(false);
            setTitle("");
            setDescription("");
            setCloseTime("");
            router.refresh();
        });
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-sky-400 text-xl font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100 cursor-pointer"
                aria-label="Request a market"
                title="Request a market"
            >
                +
            </button>

            {open ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-zinc-950">
                                    Request a market
                                </h2>
                                <p className="mt-1 text-sm text-zinc-600">
                                    Submit the title, description, and close time.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
                            >
                                Close
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">
                                    Title
                                </label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full rounded-lg border border-zinc-300 text-zinc-900 px-3 py-2 outline-none focus:border-zinc-900"
                                    placeholder="Will Alexander Li reach first base by July 1?"
                                    maxLength={120}
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="min-h-28 w-full rounded-lg border border-zinc-300 text-zinc-900 px-3 py-2 outline-none focus:border-zinc-900"
                                    placeholder="Explain what the market is about."
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">
                                    Close time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={closeTime}
                                    onChange={(e) => setCloseTime(e.target.value)}
                                    className="w-full rounded-lg border border-zinc-300 text-zinc-900 px-3 py-2 outline-none focus:border-zinc-900"
                                    required
                                />
                            </div>

                            {error ? (
                                <p className="text-sm text-red-600">{error}</p>
                            ) : null}

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="rounded-lg bg-zinc-950 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                                >
                                    {isPending ? "Submitting..." : "Submit request"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </>
    );
}