import React, { useEffect, useState, useMemo } from 'react';
import '../assets/css/modal.css'; // Import or define your component styles
import { useNavigate } from 'react-router-dom';

const AssessmentInstructionModal = ({ isOpen, onClose, onStepUpdate, currentStep }) => {
  // if (!isOpen) return null;
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    if (step == 2)
      localStorage.setItem('isGroupInstructionComplete', '1');
    onStepUpdate(step);
  }, [step]);

  const stepInstructions = useMemo(() => {
    switch (step) {
      case 0:
        return (<div className="no-blur-content guide-container absolute top-28 left-[3%] md:left-1/4 z-50 w-full h-auto pb-16">
          <svg xmlns="http://www.w3.org/2000/svg" className="guide-arrow w-8"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M5 15l7-7 7 7" />
          </svg>
          <h3 className='text-lg font-medium text-black mb-2'><strong>Step {step + 1}:</strong>  Create an Assignment.</h3>
          <p className="guide-text font-medium">
            To get started, click on the “Create Assignment” button. This is where you’ll set up the
            assignment details, such as the title, due date, and instructions for your students. Think of this
            as the “foundation” of the grading process. It’s simple, intuitive, and ensures your students know
            exactly what to do.<br />
          </p>
          <button
            onClick={onClose}
            className="absolute top-0 right-0 p-2 text-black font-black rounded-full"
          >
            X
          </button>
          <button
            onClick={() => setStep(prev => prev + 1)}
            className="absolute bottom-0 right-0 p-2 text-black font-medium rounded-md bg-blue-200 m-2 text-sm"
          >
            NEXT
          </button>
        </div>)

      case 1:
        return (<div className="no-blur-content guide-container absolute top-0 left-[3%] md:left-[10%] z-50 md:max-w-[70%] w-full md:h-auto pb-12">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className='absolute bottom-0 guide-arrow w-8 left-[3%] md:left-[10%]'>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
          <h3 className='text-lg font-medium text-black mb-2'><strong>Step {step + 1}:</strong> View and Manage Your Assignment.</h3>
          <p className="guide-text font-medium text-left h-80 overflow-scroll md:h-auto">
            <p>Once you’ve created an assignment, you can click the “View Details” button to see all the
              information related to that assignment.</p>
            Here’s what you can do next:
            <ul>
              <li>
                <strong>● Edit Assignment:</strong> If you need to make changes, click the blue pencil icon to edit the
                assignment details.
              </li>
              <li>
                <strong>● Delete Assignment:</strong> Want to remove an assignment? Click the red trash icon, but
                remember—this will delete the assignment and all the associated student submissions.
                Only use this option if you’re sure you won’t need the data again.
                This step ensures you have full control over your assignments.
              </li>
            </ul>
          </p>
          <button
            onClick={onClose}
            className="absolute top-0 right-0 p-2 text-black font-black rounded-full"
          >
            X
          </button>
          <button
            onClick={() => setStep(prev => prev + 1)}
            className="absolute bottom-0 right-0 p-2 text-black font-medium rounded-md bg-blue-200 m-2 text-sm"
          >
            NEXT
          </button>
        </div>)

      case 2:
        return (<div className="no-blur-content guide-container absolute top-[330px] left-[3%] md:left-[40%] z-50 w-full h-60">
          <svg xmlns="http://www.w3.org/2000/svg" className="guide-arrow w-8"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M5 15l7-7 7 7" />
          </svg>
          <p className="guide-text font-medium">
            This switch is used to toggle between upload and file list views!<br />
            <strong>Step {step}:</strong> Turning on the switch to <strong>upload view</strong>.
          </p>
          <button
            onClick={onClose}
            className="absolute top-0 right-0 p-2 text-black font-black rounded-full"
          >
            X
          </button>
          <button
            onClick={() => {
              setStep(-1);
              onClose();
            }}
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