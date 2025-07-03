import React, { useEffect, useState, useMemo } from 'react';
import '../assets/css/modal.css'; // Import or define your component styles
import { useNavigate } from 'react-router-dom';

const AssessmentInstructionModal = ({ isOpen, onClose, onStepUpdate }) => {
  // if (!isOpen) return null;
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    if(step==2)
      localStorage.setItem('isGroupInstructionComplete', '1');
    onStepUpdate(step);
  }, [step]);

  const stepInstructions = useMemo(() => {
    switch (step) {
      case 0:
        return (<div className="no-blur-content guide-container absolute top-[30%] left-1/3 z-50 w-full h-48">
              <svg xmlns="http://www.w3.org/2000/svg" className="guide-arrow w-8"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M5 15l7-7 7 7" />
              </svg>
              <div className="guide-text font-medium">
                <h3>Do you want to take a tourof ACADEX MINI!</h3><br/>
                It will help you understand our service better
              </div>
              <button 
                onClick={onClose} 
                className="absolute top-0 right-0 p-2 text-black font-black rounded-full"
              >
                X
              </button>
              <button 
                onClick={() => setStep(prev => prev+1)} 
                className="absolute bottom-0 right-0 p-2 text-black font-medium rounded-md bg-blue-200 m-2 text-sm"
              >
                NEXT
              </button>
            </div>)
            
    
      default:
        break;
    }
  }, [step]);
  

  return (
    <>
    {isOpen ? <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative h-full">
        <div className="no-blur-container">
          <div className="no-blur-overlay">
            {stepInstructions}
          </div>
        </div>
      </div>
    </div> : null}
    </>
  );
};

export default AssessmentInstructionModal;