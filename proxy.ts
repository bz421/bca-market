import authMiddleware from "next-auth/middleware";
import { NextResponse } from 'next/server';

export default function middleWare(req: any) {
    const { pathName } = req.nextUrl;

    if (pathName.startsWith('/api/inngest')) {
        return NextResponse.next();
    }

    return authMiddleware(req);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth API routes)
         * - auth (auth pages)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!api/auth|api/inngest(?:/.*)?|auth|_next/static|_next/image|favicon.ico|public).*)",
    ],
};