import { useState, useEffect } from 'react';

const Switcher = ({ title, handleClick, enabled }) => {
  const [isEnabled, setIsEnabled] = useState(enabled);

  useEffect(() => {
    setIsEnabled(enabled);
  }, [enabled]);

  const toggle = () => {
    setIsEnabled(!isEnabled);
    handleClick(!isEnabled);
  };

  return (
    <div className='flex'>
      <label
        htmlFor={`toggle-${title}`}
        className="flex cursor-pointer select-none items-center"
      >
        <div className='mx-2 text-secondary text-lg'>{title}</div>
        <div className="relative">
          <input
            type="checkbox"
            id={`toggle-${title}`}
            className="sr-only"
            checked={isEnabled}
            onChange={toggle}
          />
          <div className="block h-8 w-14 rounded-full bg-meta-9"></div>
          <div
            className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-primary transition ${isEnabled && '!right-1 !translate-x-full !bg-success'
              }`}
          ></div>
        </div>
      </label>
    </div>
  );
};

export default Switcher;