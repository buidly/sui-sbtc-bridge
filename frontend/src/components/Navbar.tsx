import React from 'react';
import { Button } from "@/components/ui/button";

function Navbar() {
  return (
    <nav className="bg-slate-900 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Stacks + Sui dApp</h1>
        <div className="flex gap-4">
          <Button variant="link" className="text-white">Home</Button>
          <Button variant="link" className="text-white">About</Button>
          <Button variant="link" className="text-white">Docs</Button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
