import { inngest } from '@/lib/inngest'
import { resend, FROM, chunk, emailHtml } from '@/lib/resend'
import { prisma } from '@/lib/prisma'

import {
    userCreated,
    marketRequested,
    marketAccepted,
    marketRejected,
    marketRefunded,
    marketResolved,
} from '@/lib/inngest'


export const onUserCreated = inngest.createFunction(
    {
        id: 'user-onboarding-email',
        triggers: [userCreated],
    },
    async ({ event, step }) => {
        const { email, firstName, lastName } = event.data
        const name = firstName ?? 'user'
        // console.log(`Data: ${JSON.stringify(event.data)}`)

        await step.run('send-onboarding-email', () =>
            resend.emails.send({
                from: FROM,
                to: email,
                subject: 'Welcome to BCA Market',
                html: emailHtml(
                    `Welcome, ${name}!`,
                    `<p>Your account is ready! On BCA Market, you can request your own markets and trade on anything BCA. 
                    We're so excited to have you on board!</p>
                    <p><a href="${process.env.NEXTAUTH_URL}/" style="background:#09090b;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;">Go to BCA Market</a></p>`
                ),
            })
        )

        await step.run('add-to-digests', () =>
            resend.contacts.create({
                segments: [
                    { id: process.env.MORNING_DIGEST_SEGMENT_ID! },
                    { id: process.env.NOON_DIGEST_SEGMENT_ID! },
                    { id: process.env.EVENING_DIGEST_SEGMENT_ID! },
                ],
                email,
                firstName: firstName ?? undefined,
                lastName: lastName ?? undefined,
                unsubscribed: false
            })
        )
    }
)


export const onMarketRequested = inngest.createFunction(
    {
        id: 'market-requested-notify-admins',
        triggers: [marketRequested],
    },
    async ({ event, step }) => {
        const { title, creatorName, marketId } = event.data

        const admins = await step.run('fetch-admins', () =>
            prisma.user.findMany({
                where: { admin: true },
                select: { email: true },
            })
        )

        // console.log(`Admins to notify: ${admins.map(a => a.email).join(', ')}`)

        if (admins.length === 0) return

        await step.run('email-admins', () =>
            resend.batch.send(
                admins.map((a) => ({
                    from: FROM,
                    to: a.email,
                    subject: `New Market Request: "${title}"`,
                    html: emailHtml(
                        'New Market Pending Approval',
                        `<p>A new market request has been submitted for approval:</p>
                         <p><strong>${title}</strong></p>
                         <p><a href="${process.env.NEXTAUTH_URL}/markets/${marketId}" style="background:#09090b;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;">View Market</a></p>`
                    ),
                }))
            )
        )
    }
)

export const onMarketAccepted = inngest.createFunction(
    {
        id: 'market-accepted-emails',
        triggers: [marketAccepted],
    },

    async ({ event, step }) => {
        const { marketId, title, description, creatorId, creatorName } = event.data

        // Notify the creator first
        const creator = await step.run('fetch-creator', () =>
            prisma.user.findUnique({ where: { id: creatorId }, select: { email: true } })
        )

        if (creator) {
            await step.run('email-creator', () =>
                resend.emails.send({
                    from: FROM,
                    to: creator.email,
                    subject: `Your Market Was Approved: "${title}"`,
                    html: emailHtml(
                        'Market Approved',
                        `<p>Your market <strong>"${title}"</strong> has been approved and is now open for trading.</p>
                         <p><a href="${process.env.NEXTAUTH_URL}/markets/${marketId}" style="background:#09090b;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;">View Market</a></p>`
                    ),
                })
            )
        }

        // // Broadcast to all other users
        // const allUsers = await step.run('fetch-all-users', () =>
        //     prisma.user.findMany({
        //         where: {
        //             AND: [
        //                 { id: { not: creatorId } },
        //                 { id: { not: Number(process.env.TREASURY_ACCOUNT_ID) } },
        //             ]
        //         },
        //         select: { email: true },
        //     })
        // )

        // const batches = chunk(allUsers)
        // for (let i = 0; i < batches.length; i++) {
        //     const batch = batches[i]
        //     await step.run(`email-batch-${i}`, () =>
        //         resend.batch.send(
        //             batch.map(u => ({
        //                 from: FROM,
        //                 to: u.email,
        //                 subject: `New Market Open: "${title}"`,
        //                 html: emailHtml(
        //                     'New Market Now Open',
        //                     `<p>A new market is open for trading on BCA Market:</p>
        //                      <p style="padding:12px 16px;background:#f4f4f5;border-radius:8px;">
        //                        <strong>${title}</strong><br>
        //                        <span style="color:#71717a;font-size:14px;">${description}</span>
        //                      </p>
        //                      <p><a href="${process.env.NEXTAUTH_URL}/markets/${marketId}" style="background:#09090b;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;">View Market</a></p>`
        //                 ),
        //             }))
        //         )
        //     )
        // }
    }
)

export const onMarketRejected = inngest.createFunction(
    {
        id: 'market-rejected-email',
        triggers: [marketRejected],
    },
    async ({ event, step }) => {
        const { title, creatorId } = event.data

        const creator = await step.run('fetch-creator', () =>
            prisma.user.findUnique({ where: { id: creatorId }, select: { email: true } })
        )

        if (!creator) return

        await step.run('send-email', () =>
            resend.emails.send({
                from: FROM,
                to: creator.email,
                subject: `Market Not Approved: "${title}"`,
                html: emailHtml(
                    'Market Not Approved',
                    `<p>Your market request <strong>"${title}"</strong> was not approved at this time.</p>
                     <p>You can submit a new request from the home page.</p>`
                ),
            })
        )
    }
)

export const onMarketRefunded = inngest.createFunction(
    {
        id: 'market-refunded-emails',
        triggers: [marketRefunded],
    },
    async ({ event, step }) => {
        const { title, refunds } = event.data

        const userIds = refunds.map(r => r.userId)
        const users = await step.run('fetch-users', () =>
            prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, email: true, firstName: true },
            })
        )

        const userMap = new Map(users.map(u => [u.id, u]))
        const emails = refunds
            .map(r => ({ r, user: userMap.get(r.userId) }))
            .filter((x): x is { r: typeof refunds[number]; user: NonNullable<typeof users[number]> } => !!x.user)

        const batches = chunk(emails)
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i]
            await step.run(`email-batch-${i}`, () =>
                resend.batch.send(
                    batch.map(({ r, user }) => ({
                        from: FROM,
                        to: user.email,
                        subject: `Refund Issued: "${title}"`,
                        html: emailHtml(
                            'Market Refunded',
                            `<p>The market <strong>"${title}"</strong> has been cancelled and your position has been refunded.</p>
                             <p style="padding:12px 16px;background:#f4f4f5;border-radius:8px;font-size:15px;">
                               Amount returned: <strong>$${r.amount.toFixed(2)}</strong>
                             </p>`
                        ),
                    }))
                )
            )
        }
    }
)

export const onMarketResolved = inngest.createFunction(
    {
        id: 'market-resolved-emails',
        triggers: [marketResolved],
    },
    async ({ event, step }) => {
        const { title, winningOutcomeName, positions } = event.data

        const userIds = positions.map(p => p.userId)
        const users = await step.run('fetch-users', () =>
            prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, email: true, firstName: true },
            })
        )

        const userMap = new Map(users.map(u => [u.id, u]))
        const emails = positions
            .map(p => ({ p, user: userMap.get(p.userId) }))
            .filter((x): x is { p: typeof positions[number]; user: NonNullable<typeof users[number]> } => !!x.user)

        const batches = chunk(emails)
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i]
            await step.run(`email-batch-${i}`, () =>
                resend.batch.send(
                    batch.map(({ p, user }) => {
                        const name = user.firstName ?? 'there'
                        return p.isWinner
                            ? {
                                from: FROM,
                                to: user.email,
                                subject: `You Won: "${title}"`,
                                html: emailHtml(
                                    `Congratulations, ${name}!`,
                                    `<p>The market <strong>"${title}"</strong> has resolved.</p>
                                     <p style="padding:12px 16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
                                       <strong style="color:#15803d;">✓ Your outcome won: ${p.outcomeName}</strong><br>
                                       <span style="color:#166534;">Payout: <strong>$${p.payout.toFixed(2)}</strong></span>
                                     </p>
                                     <p>Your balance has been updated.</p>`
                                ),
                            }
                            : {
                                from: FROM,
                                to: user.email,
                                subject: `Market Resolved: "${title}"`,
                                html: emailHtml(
                                    'Market Resolved',
                                    `<p>The market <strong>"${title}"</strong> has resolved.</p>
                                     <p style="padding:12px 16px;background:#f4f4f5;border-radius:8px;">
                                       <strong>Winning outcome:</strong> ${winningOutcomeName}<br>
                                       <span style="color:#71717a;">Your outcome <strong>${p.outcomeName}</strong> did not win this time.</span>
                                     </p>`
                                ),
                            }
                    })
                )
            )
        }
    }
)

export const onMarketDigest = inngest.createFunction(
    {
        id: 'market-digest',
        triggers: [
            { cron: 'TZ=America/New_York 35 7 * * *' },
            { cron: 'TZ=America/New_York 0 12 * * *' },
            { cron: 'TZ=America/New_York 0 18 * * *' },
        ]
    },
    async ({ step }) => {
        const markets = await step.run('fetch-undigested-markets', () =>
            prisma.market.findMany({
                where: {
                    status: 'OPEN',
                    sentInDigest: false,
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                },
                orderBy: { approvedAt: 'asc' },
            })
        )

        if (markets.length === 0) {
            return { sent: false, reason: 'no new markets since last digest' }
        }

        const now = new Date()
        const hour = now.getUTCHours()
        const timeLabel = (11 <= hour && hour <= 15) ? 'Morning' : (16 <= hour && hour <= 20) ? 'Afternoon' : 'Evening'

        const marketRowsHtml = markets
            .map(
                (m) => `
                <tr>
                  <td style="padding:16px 0;border-bottom:1px solid #e4e4e7;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#09090b;">${m.title}</p>
                    <p style="margin:0 0 10px;font-size:14px;color:#71717a;">${m.description}</p>
                    <a href="${process.env.NEXTAUTH_URL}/markets/${m.id}"
                       style="font-size:13px;font-weight:500;color:#09090b;text-decoration:none;">
                      Trade now
                    </a>
                  </td>
                </tr>`
            )
            .join('')

        const marketCount = markets.length
        const plural = marketCount !== 1

        // {{{contact.first_name|there}}} is Resend's personalization syntax for Broadcasts.
        // {{{RESEND_UNSUBSCRIBE_URL}}} is automatically replaced with a per-contact
        // unsubscribe link; Resend handles the unsubscribe flow automatically.
        const html = emailHtml(
            `${timeLabel} Markets`,
            `<p>Good ${timeLabel}, {{{contact.first_name|there}}}</p>
             <p><strong>${marketCount} new market${plural ? 's are' : ' is'} featured</strong> on BCA Market:</p>
             <table style="width:100%;border-collapse:collapse;border-top:1px solid #e4e4e7;">
               ${marketRowsHtml}
             </table>
             <p style="margin-top:24px;">
               <a href="${process.env.NEXTAUTH_URL}/"
                  style="background:#09090b;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;">
                 Go to BCA Market
               </a>
             </p>
             <p style="margin-top:40px;font-size:12px;color:#a1a1aa;">
               You're receiving this because you have a BCA Market account.
               <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#a1a1aa;">Unsubscribe</a> at any time.
             </p>`
        )

        // "name" is internal only — used to identify this broadcast in the Resend dashboard.
        // "send: true" creates and sends in one API call (no separate send step needed).
        const broadcastName = `digest-${now.toISOString().slice(0, 13)}h` // e.g. "digest-2025-06-15T12h"

        await step.run('send-broadcast', () => {
            const result = resend.broadcasts.create({
                segmentId: timeLabel === 'Morning'
                    ? process.env.MORNING_DIGEST_SEGMENT_ID!
                    : timeLabel === 'Afternoon'
                        ? process.env.NOON_DIGEST_SEGMENT_ID!
                        : process.env.EVENING_DIGEST_SEGMENT_ID!,
                from: FROM,
                subject: `Good ${timeLabel}! ${marketCount} new market${plural ? 's' : ''} open`,
                html,
                name: broadcastName,
                send: true,
            })

            console.log(`Broadcast result: ${JSON.stringify(result)}`)
        }
        )

        // Mark these markets as digested so they don't appear in the next digest.
        const marketIds = markets.map((m) => m.id)
        await step.run('mark-markets-digested', () =>
            prisma.market.updateMany({
                where: { id: { in: marketIds } },
                data: { sentInDigest: true },
            })
        )

        return { sent: true, count: marketCount, broadcastName }
    }
)