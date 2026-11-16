"use client";

import { useParams } from "next/navigation";
import MediaPage from "@/components/MediaPage";

export default function GamePage() {
  const { id } = useParams();
  return <MediaPage key={id} kind="game" id={decodeURIComponent(id)} />;
}
