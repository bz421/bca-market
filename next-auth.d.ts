import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: DefaultSession["user"] & {
            id?: string | null;
            firstName?: string | null;
            lastName?: string | null;
            money?: string | null; // send money as string
            admin?: boolean | null;
        };
    }

    interface User {
        id?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        money?: string | null;
        admin?: boolean | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        money?: string | null;
        admin?: boolean | null;
    }
}
