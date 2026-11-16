"use client";

import { useParams } from "next/navigation";
import MediaPage from "@/components/MediaPage";

export default function BookPage() {
  const { id } = useParams();
  return <MediaPage key={id} kind="book" id={decodeURIComponent(id)} />;
}
