import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
} from "firebase/auth";
import { auth } from "@/src/utils/firebase";

WebBrowser.maybeCompleteAuthSession();

export const useGoogleSignIn = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
    scopes: ["profile", "email"],
  });

  useEffect(() => {
    handleGoogleResponse();
  }, [response]);

  const handleGoogleResponse = async () => {
    if (response?.type === "success") {
      setLoading(true);
      setError(null);

      try {
        const { id_token } = response.params;
        console.log("Google ID Token received");

        // Create credential from ID token
        const credential = GoogleAuthProvider.credential(id_token);

        // Sign in with Firebase using the credential
        const result = await signInWithCredential(auth, credential);
        const firebaseUser = result.user;

        console.log("Firebase user signed in:", firebaseUser.email);

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          avatar: firebaseUser.photoURL,
          idToken: id_token,
        });

        setLoading(false);
      } catch (err: any) {
        console.error("Firebase sign-in error:", err);
        setError(err.message || "Failed to sign in with Firebase");
        setLoading(false);
      }
    } else if (response?.type === "error") {
      setError("Google sign-in was cancelled or failed");
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setError(null);
    } catch (err: any) {
      console.error("Logout error:", err);
      setError(err.message || "Failed to logout");
    }
  };

  return {
    user,
    loading,
    error,
    promptAsync,
    isDisabled: !request,
    logout,
  };
};
