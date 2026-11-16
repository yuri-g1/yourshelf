"use client";

import { useParams } from "next/navigation";
import MediaPage from "@/components/MediaPage";

export default function AlbumPage() {
  const { id } = useParams();
  return <MediaPage key={id} kind="album" id={decodeURIComponent(id)} />;
}
