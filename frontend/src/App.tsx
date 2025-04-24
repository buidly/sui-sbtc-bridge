import React from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import { Route, Routes } from "react-router-dom";
import Bridge from "@/pages/Bridge.tsx";
import { ROUTES } from "@/lib/routes.ts";
import Swap from "@/pages/Swap.tsx";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <Navbar />

        <Routes>
          <Route path={ROUTES.home} element={<Bridge />} />
          <Route path={ROUTES.swap} element={<Swap />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
