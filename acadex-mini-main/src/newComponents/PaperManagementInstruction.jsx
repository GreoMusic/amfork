import React, { useEffect, useState, useMemo } from 'react';
import '../assets/css/modal.css'; // Import or define your component styles

const PaperManagementInstruction = ({ isOpen, onClose, onStepUpdate }) => {
  // if (!isOpen) return null;
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step == 3)
      localStorage.setItem('isPaperInstructionComplete', '1');
    onStepUpdate(step);
  }, [step]);

  const handleClose = () => {
    confirm('Are you sure you want to close the instruction?') ? onClose ? onClose() : null : null;
    // onClose ? onClose() : null;
  };

  const stepInstructions = useMemo(() => {
    switch (step) {
      case 0:
        return (<div className="no-blur-content guide-container absolute h-48 top-[180px] right-10 z-50 w-full h-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="guide-arrow w-8"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M5 15l7-7 7 7" />
          </svg>
          <h3 className='text-lg font-medium text-black mb-2'><strong>Step {step + 3}:</strong> Upload Papers.</h3>
          <p className="guide-text font-medium text-left">
            After clicking <strong>“Show Upload”</strong> the next step is uploading student submissions. <br />
            Look for the “Upload Papers” button—it’s clearly labeled to make this process quick and easy. <br />
            Simply click the button and upload the student papers. Acadex Mini will handle the rest,
            ensuring every submission is neatly organized for grading.
          </p>
          <button
            onClick={handleClose}
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
        return (<div className="no-blur-content guide-container absolute top-[15%] left-[3%] md:left-[10%] z-[55] max-w-[70%] w-full h-auto pb-12">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className='mb-4 absolute bottom-0 guide-arrow w-8'>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>

          <h3 className='text-lg font-medium text-black mb-2'><strong>Step {step + 3}:</strong> Grade Your Assignments.</h3>
          <div className="guide-text font-medium text-left">
            Grade Your Assignments!<br />
            Once papers are uploaded, you’ll notice new options on the right-hand side of your screen. This is where the magic happens:
            <ul>
              <li>
                <strong>● Assignment Overview:</strong> See all the uploaded papers for this assignment in one place.
              </li>
              <li>
                <strong>● Grade All:</strong> Click this button to grade every submission in one go using Acadex Mini’s
                AI-powered grading system.
              </li>
              <li>
                <strong>● Grade Individually:</strong> If you prefer a more hands-on approach, you can grade each paper
                one at a time.
              </li>
            </ul>
            These tools are designed to save you time while giving you the flexibility to manage grading
            however you prefer.
          </div>
          <button
            onClick={handleClose}
            className="absolute top-0 right-0 p-2 text-black font-black rounded-full"
          >
            X
          </button>
          <button
            onClick={() => {
              setStep(prev => prev + 1);
              onClose();
            }}
            className="absolute bottom-0 right-0 p-2 text-black font-medium rounded-md bg-blue-200 m-2 text-sm"
          >
            DONE
          </button>
        </div>)

      // case 1:
      //   return (<div className="no-blur-content guide-container absolute top-[110px] left-[40%] z-50 w-full h-60">
      //     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className='absolute bottom-0 guide-arrow w-8'>
      //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      //     </svg>

      //     <p className="guide-text font-medium">
      //       Upload file view!<br />
      //       <strong>Step {step + 3}:</strong> We support wide range of file types, TEXT, PDF, PPT, DOC, JPG, PNG <strong>upload view</strong>.
      //     </p>
      //     <button
      //       onClick={onClose}
      //       className="absolute top-0 right-0 p-2 text-black font-black rounded-full"
      //     >
      //       X
      //     </button>
      //     <button
      //       onClick={() => setStep(prev => prev + 1)}
      //       className="absolute bottom-0 right-0 p-2 text-black font-medium rounded-md bg-blue-200 m-2 text-sm"
      //     >
      //       NEXT
      //     </button>
      //   </div>)

      // case 2:
      //   return (<div className="no-blur-content guide-container absolute top-[400px] left-[40%] z-50 w-full h-60">
      //     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className='absolute bottom-0 guide-arrow w-8'>
      //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      //     </svg>

      //     <p className="guide-text font-medium">
      //       File list view!<br />
      //       <strong>Step {step + 3}:</strong> Uploaded files will be listed here. You can evaluate paper individually.
      //     </p>
      //     <button
      //       onClick={onClose}
      //       className="absolute top-0 right-0 p-2 text-black font-black rounded-full"
      //     >
      //       X
      //     </button>
      //     <button
      //       onClick={() => setStep(prev => prev + 1)}
      //       className="absolute bottom-0 right-0 p-2 text-black font-medium rounded-md bg-blue-200 m-2 text-sm"
      //     >
      //       NEXT
      //     </button>
      //   </div>)

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

export default PaperManagementInstruction;