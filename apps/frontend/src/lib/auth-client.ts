import { createAuthClient } from "better-auth/react";

export const { signIn, signUp, signOut, useSession } = createAuthClient();

export const loginWithGoogle = async () => {
    await signIn.social({
        provider: "google",
        callbackURL: "/dashboard", // Where to go after login
    });
};