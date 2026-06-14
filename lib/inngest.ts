import { Inngest, eventType, staticSchema } from 'inngest'

export const inngest = new Inngest({
    id: 'bca-market'
})


export type UserCreatedData = {
    userId: number
    email: string
    firstName: string | null
}

export const userCreated = eventType('user/created', {
    schema: staticSchema<UserCreatedData>(),
})

export type MarketRequestedData = {
    marketId: number
    title: string
    creatorId: number
    creatorName: string
}

export const marketRequested = eventType('market/requested', {
    schema: staticSchema<MarketRequestedData>(),
})

export type MarketAcceptedData = {
    marketId: number
    title: string
    description: string
    creatorId: number
    creatorName: string
}

export const marketAccepted = eventType('market/accepted', {
    schema: staticSchema<MarketAcceptedData>(),
})

export type MarketRejectedData = {
    marketId: number
    title: string
    creatorId: number
    creatorName: string
}

export const marketRejected = eventType('market/rejected', {
    schema: staticSchema<MarketRejectedData>(),
})

export type MarketRefundedData = {
    marketId: number
    title: string
    refunds: Array<{
        userId: number
        amount: number
    }>
}

export const marketRefunded = eventType('market/refunded', {
    schema: staticSchema<MarketRefundedData>(),
})

export type MarketResolvedData = {
    marketId: number
    title: string
    winningOutcomeName: string
    positions: Array<{
        userId: number
        isWinner: boolean
        outcomeName: string
        payout: number
    }>
}

export const marketResolved = eventType('market/resolved', {
    schema: staticSchema<MarketResolvedData>(),
})