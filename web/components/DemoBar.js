"use client";

import { demo } from "@/lib/demo";

export default function DemoBar() {
  return (
    <div className="demo-bar">
      <div className="container demo-bar-inner">
        <p>
          <span className="tag">Demo mode</span>{" "}
          <strong>Sample data only.</strong> Names and titles are lorem ipsum and
          changes stay in this browser.
        </p>
        <button className="text-link" onClick={() => demo.reset()}>
          Reset demo
        </button>
      </div>
    </div>
  );
}
