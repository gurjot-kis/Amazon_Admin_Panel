import React from "react";
import { Outlet } from "react-router-dom";
import VendorSidebar from "./VendorSidebar";
import Navbar from "../Navbar";
import { LayoutProvider } from "../LayoutContext";

export default function VendorLayout(): React.ReactElement {
  return (
    <LayoutProvider>
      <div
        className="d-flex min-vh-100 position-relative pe-0 pe-md-3"
        style={{ background: "#eef2f6" }}
      >
        <VendorSidebar />
        <div className="d-flex flex-column flex-grow-1 min-w-0">
          <Navbar />
          <main className="flex-grow-1 p-3 p-md-4">
            <Outlet />
          </main>
        </div>
      </div>
    </LayoutProvider>
  );
}
