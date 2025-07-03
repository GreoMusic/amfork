import React, { useEffect, useState } from "react";

const BottomStepper = ({ isOpen = false, onStepChange, bottomStep, title = '', steps = [] }) => {
    const [currentStep, setCurrentStep] = useState(0);

    // const steps = ["Step 1", "Step 2", "Step 3", "Step 4"];

    useEffect(() => {
        if (onStepChange) {
            onStepChange(currentStep);
        }
    }, [currentStep, onStepChange]);

    useEffect(() => {
        setCurrentStep(bottomStep);
    }, [bottomStep]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep((prev) => prev + 1);
        }
        if (currentStep === steps.length - 1) {
            const lastSegment = new URL(window.location.href).pathname.split('/').filter(Boolean).pop();
            if (lastSegment === 'files') {
                confirm('Are you sure you want to close the instruction?') ? onStepChange(-2) : null;
            }
            console.log('lastSegment', lastSegment);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    return (
        isOpen ? <div className="fixed bottom-0 left-0 w-full bg-gray-100 p-4 shadow-lg">
            <h2 className="text-xl text-center">{title}</h2>
            <div className="flex justify-between items-center">
                <button
                    className={`ml-20 px-4 py-2 text-white rounded ${currentStep === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500"}`}
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                >
                    Previous
                </button>

                <div className="flex">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className={`w-auto py-2 flex items-center justify-center px-2 text-sm font-bold ${index <= currentStep
                                ? "bg-blue-500 text-white"
                                : "bg-gray-300 text-gray-700"
                                }`}
                        >
                            {step}
                        </div>
                    ))}
                </div>

                {/* Next Button */}
                <button
                    className={`px-4 py-2 text-white rounded ${currentStep === steps.length - 1 ? "bg-green-800" : "bg-blue-500"}`}
                    onClick={handleNext}
                // disabled={currentStep === steps.length - 1}
                >
                    {currentStep === steps.length - 1 ? "Finish" : "Next"}
                </button>
            </div>
        </div> : null
    );
};

export default BottomStepper;