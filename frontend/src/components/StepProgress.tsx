import React from "react";

const StepProgress = ({ currentStep = 1, steps = ["Pending", "Minting", "Completed"] }) => {
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
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors duration-300 ${
                      index + 1 <= currentStep
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-gray-300 bg-slate-300 text-slate-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      index + 1 <= currentStep ? "text-orange-500" : "text-slate-300"
                    }`}
                  >
                    {step}
                  </span>
                </div>

                {/* Lines between steps */}
                {showLineToNext && (
                  <div className="flex-1 relative h-1">
                    {/* Background line */}
                    <div className="absolute top-0 left-0 w-full h-full bg-slate-300"></div>

                    {/* Filled line */}
                    <div
                      className="absolute top-0 left-0 h-full bg-orange-500 transition-all duration-300"
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
