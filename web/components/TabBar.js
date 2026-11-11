"use client";

import DockNav from "@/components/DockNav";

// Mobile only: the same dock, floating at the bottom of the screen.
export default function TabBar({ links }) {
  if (!links?.length) return null;

  return (
    <div className="tabbar">
      <div className="dock dock-bottom">
        <DockNav links={links} />
      </div>
    </div>
  );
}
