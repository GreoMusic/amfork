import React, { useEffect, useState } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';

const DarkModeSwitch = ({onToggle}) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(()  => {
        if(localStorage.getItem('isDarkMode')!==null && localStorage.getItem('isDarkMode')==='true'){
            setIsDarkMode(true);
        }

    }, [])

    const toggleDarkMode = () => {
        const darkMode = !isDarkMode
        console.log(darkMode);
        onToggle(darkMode)
        setIsDarkMode(darkMode);
        
        localStorage.setItem('isDarkMode', darkMode ? 'true' : 'false');

        document.body.classList.toggle("dark");
        // You can add logic to toggle dark mode globally in your application
    };

    return (
        <div className="">
            <button
                className={`text-2xl ${isDarkMode ? 'text-black' : 'text-black'}`}
                onClick={toggleDarkMode}
            >
                {isDarkMode ? <FiSun className='text-black' /> : <FiMoon className='text-black' />}
            </button>
        </div>
    );
};

export default DarkModeSwitch;