import React from "react";
import { cn } from "@/lib/utils.ts";

const StepProgress = ({ currentStep = 1, steps = ["Pending", "Minting", "Completed"], accentColor = "orange" }) => {
  return (
    <div className="w-full py-5">
      <div className="flex items-center justify-center">
        <div className="relative flex w-full max-w-3xl items-center justify-between">
          {/* Steps */}
          {steps.map((step, index) => {
            // Only render lines between steps (not before first or after last)
            const showLineToNext = index < steps.length - 1;

            return (
              <React.Fragment key={index}>
                <div className="relative flex flex-col items-center z-10">
                  <div
                    className={cn(
                      `flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors duration-300`,
                      index + 1 <= currentStep
                        ? accentColor === "orange"
                          ? `border-[#f7931a] bg-[#f7931a] text-white`
                          : `border-sky-500 bg-sky-500 text-white`
                        : "border-white bg-white text-gray-500",
                    )}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`mt-2 text-sm font-semibold ${index + 1 <= currentStep ? `text-${accentColor}-400` : "text-gray-500"
                      }`}
                  >
                    {step}
                  </span>
                </div>

                {/* Lines between steps */}
                {showLineToNext && (
                  <div className="flex-1 relative h-1 -mt-6">
                    {/* Background line */}
                    <div className="absolute top-0 left-0 w-full h-full bg-white"></div>

                    {/* Filled line */}
                    <div
                      className={cn(
                        `absolute top-0 left-0 h-full transition-all duration-300`,
                        accentColor === "orange" ? `bg-[#f7931a]` : "bg-sky-500",
                      )}
                      style={{
                        width: index + 1 < currentStep ? "100%" : index + 1 === currentStep ? "50%" : "0%",
                      }}
                    ></div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepProgress;
