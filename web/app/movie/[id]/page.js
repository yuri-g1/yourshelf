"use client";

import { useParams } from "next/navigation";
import MediaPage from "@/components/MediaPage";

export default function MoviePage() {
  const { id } = useParams();
  return <MediaPage key={id} kind="movie" id={decodeURIComponent(id)} />;
}
