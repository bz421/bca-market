'use client'

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
    return (
        <button
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 cursor-pointer'
            onClick={() => signOut()}
            type='button'
            >
            Log out
        </button>
    );
}