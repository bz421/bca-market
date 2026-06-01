import NextAuth from "next-auth";
import { Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
    adapter,
});

interface CustomSession extends Session {
    user: {
        id?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                if (!user.email) {
                    return false;
                }

                // const domain = user.email.split("@")[1];
                // if (domain !== 'bergen.org') return false;

                // Check if user exists
                const existingUser = await prisma.user.findUnique({
                    where: { emailId: user.email },
                });

                if (!existingUser) {
                    // Create new user if doesn't exist
                    await prisma.user.create({
                        data: {
                            emailId: user.email,
                            firstName: profile?.name?.split(" ")[0] || "",
                            lastName: profile?.name?.split(" ").slice(1).join(" ") || "",
                        },
                    });
                }

                // Create or update the account
                await prisma.account.upsert({
                    where: {
                        provider_providerAccountId: {
                            provider: account.provider,
                            providerAccountId: account.providerAccountId,
                        },
                    },
                    create: {
                        userId: (existingUser?.userId || (await prisma.user.findUnique({ where: { emailId: user.email } }))!.userId),
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
            }
            return true;
        },
        async session({ session }) {
            if (session.user?.email) {
                const user = await prisma.user.findUnique({
                    where: { emailId: session.user.email },
                });
                if (user) {
                    const customUser = session.user as CustomSession['user'];
                    customUser.id = user.userId.toString();
                    customUser.firstName = user.firstName;
                    customUser.lastName = user.lastName || "";
                    session.user = customUser;
                }
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
    },
    session: {
        strategy: "jwt",
    },
});

export { handler as GET, handler as POST };