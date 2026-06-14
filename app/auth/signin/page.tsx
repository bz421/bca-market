import type { Metadata } from 'next';
import SignInClient from './signin-client';

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your BCA Market account and start trading on real school events.",
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    title: "Sign In - BCA Market",
    description: "Sign in to BCA Market and start trading on real school events.",
    url: "/auth/signin",
  }
}

export default function SignIn() {
  return <SignInClient />
}