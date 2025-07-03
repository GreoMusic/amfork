import React, { useState, useEffect } from 'react';

const LoaderLine = ({ duration, indefinite = false, isShowing = false }) => {
  if (!isShowing) return null;
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let interval;

    if (isRunning) {
      interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (indefinite) {
            return prevProgress >= 100 ? 0 : prevProgress + 10; // Indefinite loop
          } else {
            if (prevProgress >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prevProgress + 10; // Increment progress by 10%
          }
        });
      }, duration ? duration / 10 : 200); // Default speed if no duration
    }

    return () => clearInterval(interval); // Cleanup interval on unmount or stop
  }, [isRunning, duration, indefinite]);

  const stopLoader = () => {
    setIsRunning(false);
  };

  return (
    <div className='fixed top-0 left-0 w-full z-[1000]'>
      <div className="loader-line-container h-2">
        <div
          className="loader-line"
          style={{
            width: `${progress}%`,
            transition: 'width 0.2s ease-in-out',
          }}
        ></div>
      </div>
      {/* Optional: Button to stop the loader */}
      {/* <button onClick={stopLoader}>Stop Loader</button> */}
    </div>
  );
};

export default LoaderLine;