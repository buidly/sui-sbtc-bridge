import React from "react";
import { Button } from "@/components/ui/button";

function Navbar() {
  return (
    <nav className='bg-gray-400 text-white p-4'>
      <div className='container mx-auto flex justify-between items-center'>
        <h1 className='text-xl font-bold text-cyan-100'>Sui sBTC Bridge</h1>
        <div className='flex gap-4'>
          <Button variant='link' className='text-cyan-100'>
            TBD
          </Button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
