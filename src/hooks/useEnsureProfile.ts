import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef, useState } from "react";

/**
 * Ensures the logged-in user has a profile in the database.
 * Auto-creates one if missing (e.g. first login after signup).
 *
 * FIX H11: Added retry logic on failure (up to 3 attempts with exponential backoff)
 */
export function useEnsureProfile() {
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(
    api.profiles.getMyProfile,
    isAuthenticated ? {} : "skip"
  );
  const currentUser = useQuery(
    api.auth.currentUser,
    isAuthenticated ? {} : "skip"
  );
  const createProfile = useMutation(api.profiles.createProfile);
  const creating = useRef(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (
      isAuthenticated &&
      profile === null &&
      currentUser &&
      !creating.current &&
      retryCount < MAX_RETRIES
    ) {
      creating.current = true;

      // Get referral code from URL if present
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get("ref") || undefined;

      createProfile({
        displayName: currentUser.name || currentUser.email?.split("@")[0] || "User",
        referralCode: refCode,
      })
        .catch((err) => {
          console.error("Failed to create profile (attempt", retryCount + 1, "):", err);
          // Retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          setTimeout(() => {
            setRetryCount((c) => c + 1);
          }, delay);
        })
        .finally(() => {
          creating.current = false;
        });
    }
  }, [isAuthenticated, profile, currentUser, createProfile, retryCount]);

  return { profile, isLoading: profile === undefined && isAuthenticated };
}
