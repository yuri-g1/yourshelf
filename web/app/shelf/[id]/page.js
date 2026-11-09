"use client";

import { useParams } from "next/navigation";
import ShelfView from "@/components/ShelfView";

export default function FriendShelfPage() {
  const { id } = useParams();
  return <ShelfView userId={id} />;
}
