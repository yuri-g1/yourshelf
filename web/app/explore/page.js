import { redirect } from "next/navigation";

// Explore now lives on the home page; keep old links working
export default function ExplorePage() {
  redirect("/#shelves");
}
