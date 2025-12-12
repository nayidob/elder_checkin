"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-50 to-white px-4">
      <div className="safe-area-top w-full max-w-md rounded-3xl bg-white p-6 shadow-xl ring-1 ring-amber-100">
        <SignIn routing="path" path="/sign-in" />
      </div>
    </main>
  );
}

