import Link from "next/link";
import SignOutButton from "@/app/components/sign-out-button";

type TopNavProps = {
    title?: string;
};

export default function TopNav({ title = "BCA Market" }: TopNavProps) {
    return (
        <header className="sticky top-0 z-40 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-4">
                <Link href="/">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
                        {title}
                    </h1>
                </Link>
                

                <SignOutButton />
            </div>
        </header>
    );
}