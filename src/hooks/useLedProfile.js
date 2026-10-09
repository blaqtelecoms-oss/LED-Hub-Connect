import { useEffect, useState } from "react";
import { backend } from "@/api/backendClient";
import { useAuth } from "@/lib/AuthContext";

// Loads the signed-in user's extended profile (UserProfile) and, for business
// accounts, their Business record. Used by portal sidebars and later pages.
export function useLedProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const profiles = await backend.entities.UserProfile.filter({ user: user.id }).catch(() => []);
        if (!cancelled) setProfile(profiles[0] || null);
        if (user.account_type === "business") {
          const biz = await backend.entities.Business.filter({ owner: user.id }).catch(() => []);
          if (!cancelled) setBusiness(biz[0] || null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  return { profile, business, loading };
}