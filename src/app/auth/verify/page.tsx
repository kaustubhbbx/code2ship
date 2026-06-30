'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="card text-center">
          <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
          <p className="text-muted mb-6">
            We&apos;ve sent a verification link to:
            <br />
            <span className="font-semibold text-text">{email}</span>
          </p>

          <div className="bg-surface p-4 rounded-lg mb-6">
            <p className="text-sm text-muted">
              Click the link in your email to verify your account and get started with DURA.
            </p>
          </div>

          <p className="text-sm text-muted">
            Didn&apos;t receive the email? Check your spam folder or try signing up again.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md">
          <div className="card text-center">
            <p className="text-muted">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
