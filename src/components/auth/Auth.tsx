import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

function Auth() {
  return (
    <>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
      <SignedOut>
        <div className="flex items-center space-x-4">
          <Link to="/sign-in" className="text-sm font-medium text-gray-500 hover:text-gray-900">
            Sign in
          </Link>
          <Link
            to="/sign-up"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
          >
            Sign up
          </Link>
        </div>
      </SignedOut>
    </>
  );
}

export default Auth;