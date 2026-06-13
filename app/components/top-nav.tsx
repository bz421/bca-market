import Link from "next/link";
import SignOutButton from "@/app/components/sign-out-button";

type TopNavProps = {
    title?: string;
    mobileMenu?: React.ReactNode;
};

export default function TopNav({ title = "BCA Market", mobileMenu }: TopNavProps) {
    return (
        <header className="sticky top-0 z-40 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-8xl items-center justify-between px-8 py-4">
                <div className="flex items-center gap-2">
                    {mobileMenu}

                    <Link href="/">
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
                            {title}
                        </h1>
                    </Link>

                </div>
                <SignOutButton />
            </div>
        </header>
    );
}