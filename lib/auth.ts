import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { inngest } from "./inngest";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider !== "google") return true;
            if (!user.email) return false;

            const firstName = profile?.name?.split(" ")[0] || "";
            const lastName = profile?.name?.split(" ").slice(1).join(" ") || "";

            const existingUser = await prisma.user.findUnique({
                where: { email: user.email },
            });

            const dbUser =
                existingUser ??
                (await prisma.user.create({
                    data: {
                        email: user.email,
                        firstName,
                        lastName,
                    },
                }));

            if (!existingUser) {
                if (!user.email) return false; // should never happen due to check above
                await inngest.send({
                    name: 'user/created',
                    data: {
                        userId: dbUser.id,
                        email: user.email,
                        firstName: firstName ?? null
                    }
                })
            }

            await prisma.account.upsert({
                where: {
                    provider_providerAccountId: {
                        provider: account.provider,
                        providerAccountId: account.providerAccountId,
                    },
                },
                create: {
                    userId: dbUser.id,
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    access_token: account.access_token,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                    session_state: account.session_state,
                },
                update: {
                    access_token: account.access_token,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                    session_state: account.session_state,
                },
            });

            return true;
        },
        async session({ session }) {
            if (!session.user?.email) return session;

            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
            });

            if (!user || !session.user) return session;

            session.user.id = user.id.toString();
            session.user.firstName = user.firstName;
            session.user.lastName = user.lastName || "";
            session.user.money = user.money.toString();
            session.user.admin = user.admin;

            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
    },
    session: {
        strategy: "jwt",
    },
};