import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "../Navbar";
import { LayoutProvider } from "../LayoutContext";

export default function Layout(): React.ReactElement {
  return (
    <LayoutProvider>
      {/* Updated background to match the claymorphic canvas */}
<div
  className="d-flex min-vh-100 position-relative"
  style={{ background: "#eef2f6" }}
>
  <Sidebar />
  <div className="d-flex flex-column flex-grow-1 min-w-0">
    <Navbar />
    {/* Page content matches the margins of the floating navbar */}
    <main className="flex-grow-1 px-3 px-md-4 py-3">
      <Outlet />
    </main>
  </div>
</div>
    </LayoutProvider>
  );
}
