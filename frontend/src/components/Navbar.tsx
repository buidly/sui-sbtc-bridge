import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import sbtcLogo from "@/assets/images/sbtc_logo.png";
import { ArrowLeft, ArrowRight } from "lucide-react";
import suiLogo from "@/assets/images/sui_logo.svg";
import bitcoinLogo from "@/assets/images/bitcoin_logo.svg";
import NavbarSuiConnect from "@/components/NavbarSuiConnect.tsx";
import { ROUTES } from "@/lib/routes.ts";
import { useApp } from "@/context/app.context.tsx";

function Navbar() {
  const { suiAddress } = useApp();

  const location = useLocation();
  const isStableSwapPage = location.pathname === ROUTES.swap;

  return (
    <div className="mb-8 mx-auto">
      {/* Title */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold">
          <em className="text-sky-400">Sui</em>
          <em className="text-orange-400"> sBTC </em>
          <em className="text-amber-500">Bridge</em>
        </h1>
      </div>

      <div className="relative flex justify-center">
        <div className="inline-flex items-center bg-slate-50/5 rounded-full px-6 py-3 shadow-md">
          <img src={bitcoinLogo} alt="Bitcoin Logo" className="h-8 w-8 mx-1" />
          <ArrowRight className="h-5 w-5 mx-2 text-gray-400" />
          <img src={sbtcLogo} alt="Stacks Logo" className="h-8 w-8 mx-1" />
          <ArrowRight className="h-5 w-5 mx-2 text-gray-400" />
          <img src={suiLogo} alt="Sui Logo" className="h-8 w-8 mx-1" />
        </div>

        {suiAddress && (
          <AnimatePresence mode="wait">
            {isStableSwapPage ? (
              <>
                <motion.div
                  key="navbar-back-link"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0, width: "auto" }}
                  exit={{ opacity: 0, x: 50 }}
                  className="absolute left-0 top-1/2 -translate-y-1/2"
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={ROUTES.home}
                    className="border-2 border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-white font-semibold py-2 px-4 rounded-full shadow-md transition-colors duration-200 flex items-center"
                  >
                    <ArrowLeft className="h-5 w-5 mr-1" /> Back
                  </Link>
                </motion.div>

                <motion.div
                  key="navbar-sui-connect"
                  initial={{ opacity: 0, x: -300, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: "auto" }}
                  exit={{ opacity: 0, x: -50, width: 0 }}
                  className="absolute right-0 top-1/2 -translate-y-1/2"
                  transition={{ duration: 0.2 }}
                >
                  <NavbarSuiConnect />
                </motion.div>
              </>
            ) : (
              <motion.div
                key="navbar-swap-link"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="absolute right-0 top-1/2 -translate-y-1/2"
                transition={{ duration: 0.2 }}
              >
                <Link
                  to={ROUTES.swap}
                  className="border-2 border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-white font-semibold py-2 px-4 rounded-full shadow-md transition-colors duration-200 flex items-center"
                >
                  Go to StableSwap <ArrowRight className="h-5 w-5 ml-1" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default Navbar;
