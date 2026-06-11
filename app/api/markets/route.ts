import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { NotificationType } from "@/app/generated/prisma/browser";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
        typeof body.description === "string" ? body.description.trim() : "";
    const closeTimeValue =
        typeof body.closeTime === "string" ? body.closeTime : "";

    if (!title || !description || !closeTimeValue) {
        return NextResponse.json(
            { error: "Title, description, and close time are required." },
            { status: 400 }
        );
    }

    const closeTime = new Date(closeTimeValue);
    if (Number.isNaN(closeTime.getTime())) {
        return NextResponse.json(
            { error: "Invalid close time." },
            { status: 400 }
        );
    }

    const creator = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    });

    if (!creator) {
        return NextResponse.json(
            { error: "User record not found." },
            { status: 404 }
        );
    }

    const market = await prisma.market.create({
        data: {
            title,
            description,
            closeTime,
            creatorId: creator.id,
            status: "PENDING",
        },
    });

    const admins = await prisma.user.findMany({
        where: { admin: true },
    })

    await prisma.notification.createMany({
        data: admins.map(admin => ({
            userId: admin.id,
            type: NotificationType.MARKET_REQUEST,
            title: `New Market Request: ${market.title}`,
            body: `A new market is awaiting review.`
        }))
    })

    return NextResponse.json({ market }, { status: 201 });
}
