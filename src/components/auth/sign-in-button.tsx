"use client";

import { signIn, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";

interface SignInButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {}

export function SignInButton({ children, ...props }: SignInButtonProps) {
  const { data: session, isPending } = useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (isPending) {
    return <Button disabled {...props}>Loading...</Button>;
  }

  if (session) {
    return null;
  }

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signIn.social({
        provider: "google",
        callbackURL: "/schedule",
      });
    } catch (error) {
      console.error("Sign in error:", error);
      alert("Failed to sign in. Please check your authentication configuration.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <Button onClick={handleSignIn} disabled={isSigningIn} {...props}>
      {isSigningIn ? "Signing in..." : children || "Sign in with Google"}
    </Button>
  );
}
