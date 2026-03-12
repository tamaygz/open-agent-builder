import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

const authEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED !== 'false'

export default function SignUpPage() {
  if (!authEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-base px-20">
        <div className="max-w-lg text-center">
          <h1 className="text-title-h3 text-accent-black">Local Test Mode</h1>
          <p className="text-body-medium text-black-alpha-48 mt-8">
            Authentication is disabled. Continue directly to the app.
          </p>
          <Link
            href="/"
            className="inline-block mt-16 px-16 py-10 bg-heat-100 hover:bg-heat-200 text-white rounded-8"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-base">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          }
        }}
        routing="path"
        path="/sign-up"
        redirectUrl="/workflows"
        signInUrl="/sign-in"
      />
    </div>
  )
}
