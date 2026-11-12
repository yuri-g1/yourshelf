"use client";

import Landing from "@/components/Landing";
import ShelfView from "@/components/ShelfView";
import { ShelfSkeleton } from "@/components/Skeletons";
import { useAuth } from "@/components/AuthProvider";

export default function HomePage() {
  const { user, loading, hint } = useAuth();

  if (loading) {
    // returning visitors who were signed in get their shelf's outline;
    // everyone else sees the landing right away
    if (hint === "1") return <ShelfSkeleton />;
    if (hint === null) return null;
  }

  return user ? <ShelfView /> : <Landing />;
}
