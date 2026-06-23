function p(q: number[], b: number): number[] {
    const m = Math.max(...q);
    const denominator = q.reduce((sum, q_i) => sum + Math.exp((q_i - m) / b), 0);
    return q.map(q_i => Math.exp((q_i - m) / b) / denominator);
}

export type ChartPoint = {
    timestamp: number;
    [outcome: string]: number;
}

export function buildPriceHistory(
    outcomes: { id: number; name: string; sharesOutstanding?: number }[],
    liquidity: number,
    trades: { outcomeId: number; shares: unknown; createdAt: Date }[],
    startTime: Date): ChartPoint[] {
    const indexByOutcomeId = new Map(outcomes.map((o, i) => [o.id, i]));
    const q = outcomes.map(() => 0);

    const toPoint = (time: Date): ChartPoint => {
        const prices = p(q, liquidity);
        const point: ChartPoint = { timestamp: time.getTime() };
        outcomes.forEach((o, i) => {
            point[o.name] = prices[i] * 100;
        });
        return point;
    };

    const points: ChartPoint[] = [toPoint(startTime)];
    for (const trade of trades) {
        const idx = indexByOutcomeId.get(trade.outcomeId);
        if (idx === undefined) continue;
        q[idx] += Number(trade.shares);
        points.push(toPoint(trade.createdAt));
    }

    // append final point for the current time.
    const currentQ = outcomes.map(o => o.sharesOutstanding ?? 0);
    const currentPrices = p(currentQ, liquidity);
    const currentPoint: ChartPoint = { timestamp: Date.now() };
    outcomes.forEach((o, i) => {
        currentPoint[o.name] = currentPrices[i] * 100;
    });
    points.push(currentPoint);

    return points;
}
