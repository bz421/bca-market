import { MarketStatus } from "@/app/generated/prisma/client";

// Set market status to CLOSED if close time has passed
export function getNormalizedStatus(status: MarketStatus, closeTime: Date): MarketStatus {
    if (status === "OPEN" && new Date() >= closeTime) {
        return "CLOSED";
    }
    return status;
}
