"use client";

import Loading from "@/components/Loading";
import PublicShelves from "@/components/PublicShelves";
import ShelfView from "@/components/ShelfView";
import { useAuth } from "@/components/AuthProvider";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;

  return user ? <ShelfView /> : <PublicShelves />;
}
