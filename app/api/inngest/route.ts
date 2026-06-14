import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import {
    onUserCreated,
    onMarketRequested,
    onMarketAccepted,
    onMarketRejected,
    onMarketRefunded,
    onMarketResolved,
} from '@/inngest/functions'

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        onUserCreated,
        onMarketRequested,
        onMarketAccepted,
        onMarketRejected,
        onMarketRefunded,
        onMarketResolved,
    ],
})