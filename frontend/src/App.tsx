import React from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import StacksConnect from "./components/StacksConnect";
import SuiConnect from "./components/SuiConnect";
import BitcoinConnect from "@/components/BitcoinConnect";
import SendBTCForm from "@/components/SendBTCForm.tsx";

function App() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="container mx-auto p-4">
        <div className="max-w-5xl mx-auto px-0 grid md:grid-cols-3 gap-5">
          <div>
            <BitcoinConnect />
          </div>
          <div>
            <StacksConnect />
          </div>
          <div>
            <SuiConnect />
          </div>
        </div>

        <SendBTCForm />
      </div>
    </div>
  );
}

export default App;
