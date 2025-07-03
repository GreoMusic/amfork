import React, { useState, useEffect } from 'react';

const GroupInstructionModal = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Define the steps for group instruction
  const steps = [
    {
      title: 'Create a New Group',
      description: (
        <>
          Click the <span className="font-semibold text-purple-500">Create Group</span> button.
          This button is usually located at the top left of the Groups page.
        </>
      )
    },
    {
      title: 'Fill Group Details',
      description: (
        <>
          Enter all the required details including group name, add criteria, and other relevant information.
          Make sure to fill in all compulsory fields to proceed.
        </>
      )
    },
    {
      title: 'Add Criteria & More',
      description: (
        <>
          In the form, add your assessment criteria and any additional details that will help in reviewing the group.
          These details help to properly evaluate submissions later.
        </>
      )
    },
    {
      title: 'Finish and Save',
      description: (
        <>
          Once all details are filled, click the <span className="font-semibold text-green-500">Save</span> button to complete group creation. 
          Your group is now ready for adding assessments.
        </>
      )
    }
  ];

  useEffect(() => {
    const instructionComplete = localStorage.getItem('isGroupInstructionComplete');
    if (!instructionComplete || instructionComplete === '0') {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('isGroupInstructionComplete', '1');
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
              className={`px-4 py-2 rounded focus:outline-none ${
                currentStep === 0
                  ? 'bg-gray-300 text-gray-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
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

export default GroupInstructionModal;