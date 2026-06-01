import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: DefaultSession["user"] & {
            id?: string | null;
            firstName?: string | null;
            lastName?: string | null;
        };
    }

    interface User {
        id?: string | null;
        firstName?: string | null;
        lastName?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string | null;
        firstName?: string | null;
        lastName?: string | null;
    }
}
