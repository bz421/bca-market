'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptMarket } from "@/app/actions/acceptMarket";

type PendingMarket = {
    id: number;
    title: string;
    description: string;
    marketCreatorId: number;
    liquidity: number;
    closeTime: string | Date;
    outcomes?: Array<{ name: string }>;
};

function toDateTimeValue(value: string | Date) {
    const date = value instanceof Date ? value : new Date(value);
    const offset = date.getTimezoneOffset();

    // console.log(`Converting date: ${date.getTime()}`);
    return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
}

export default function AcceptButton({ market }: { market: PendingMarket }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState(market.title);
    const [description, setDescription] = useState(market.description);
    const [liquidity, setLiquidity] = useState(String(market.liquidity));
    const [closeTime, setCloseTime] = useState(toDateTimeValue(market.closeTime));
    const [outcomesText, setOutcomesText] = useState(
        market.outcomes?.map((outcome) => outcome.name).join("\n") ?? "",
    );
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const parsedLiquidity = Number.parseInt(liquidity, 10);
        const outcomes = outcomesText
            .split(/\r?\n/)
            .map((outcome) => outcome.trim())
            .filter(Boolean);

        if (!Number.isInteger(parsedLiquidity)) {
            setError("Liquidity must be a whole number.");
            setIsSubmitting(false);
            return;
        }

        if (outcomes.length === 0) {
            setError("Add at least one outcome.");
            setIsSubmitting(false);
            return;
        }

        try {
            await acceptMarket({
                marketId: market.id,
                creatorId: market.marketCreatorId,
                title,
                description,
                liquidity: parsedLiquidity,
                outcomes,
                closeTime: new Date(closeTime).toISOString(),
            });

            setOpen(false);
            router.refresh();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Failed to approve market.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <button
                type="button"
                className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600 cursor-pointer"
                onClick={() => setOpen(true)}
            >
                Accept
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-zinc-950">
                                    Approve market
                                </h2>
                                <p className="mt-1 text-sm text-zinc-600">
                                    Review and finalize the market before it goes live.
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
                                    onChange={(event) => setTitle(event.target.value)}
                                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    className="min-h-28 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900"
                                    required
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-zinc-700">
                                        Liquidity
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={liquidity}
                                        onChange={(event) => setLiquidity(event.target.value)}
                                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-zinc-700">
                                        Close Time (Local)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={closeTime}
                                        onChange={(event) => setCloseTime(event.target.value)}
                                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-zinc-700">
                                    Outcomes
                                </label>
                                <textarea
                                    value={outcomesText}
                                    onChange={(event) => setOutcomesText(event.target.value)}
                                    className="min-h-28 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900"
                                    placeholder="One outcome per line"
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
                                    disabled={isSubmitting}
                                    className="rounded-lg bg-zinc-950 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                                >
                                    {isSubmitting ? "Approving..." : "Approve market"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}