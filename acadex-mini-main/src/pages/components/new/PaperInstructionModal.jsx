import React, { useState, useEffect } from 'react';

const PaperInstructionModal = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Define steps for the instruction
  const steps = [
    {
      title: 'How to Upload Papers',
      description: (
        <>
          Click the <span className="font-semibold text-blue-500">Upload Papers</span> button at the top right of the dashboard.
          This opens a file selector so you can choose your documents.
        </>
      )
    },
    {
      title: 'How to Grade Papers',
      description: (
        <>
          Once papers are uploaded, use the <span className="font-semibold text-green-500">Grade All</span> or <span className="font-semibold text-green-500">Grade Checked</span> buttons to evaluate submissions.
        </>
      )
    },
    {
      title: 'Additional Information',
      description: (
        <>
          You can filter and review submissions using the available filter options. Download feedback once grading is complete.
        </>
      )
    }
  ];

  useEffect(() => {
    const instructionComplete = localStorage.getItem('isPaperInstructionComplete');
    if (!instructionComplete || instructionComplete === '0') {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('isPaperInstructionComplete', '1');
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
            {steps[currentStep].title}
          </h2>
          <div className="text-gray-700 dark:text-gray-300 text-base">
            {steps[currentStep].description}
          </div>
          <div className="flex justify-between mt-6">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded focus:outline-none ${currentStep === 0 ? 'bg-gray-300 text-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
            >
              {currentStep === steps.length - 1 ? 'Got it!' : 'Next'}
            </button>
          </div>
          <div className="flex justify-center mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 mx-1 rounded ${index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperInstructionModal;