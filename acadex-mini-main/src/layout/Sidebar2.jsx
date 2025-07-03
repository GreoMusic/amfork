import React, { useState } from 'react';
import { FiSun, FiMoon, FiHome, FiEdit3, FiInfo, FiCreditCard, FiLogOut, FiPlus, FiSearch, FiEye, FiTrash2, FiMinus } from 'react-icons/fi';
import { useAuth } from '../provider/authProvider';
import '../assets/css/NewDesign.css';
import DarkModeSwitch from '../pages/components/DarkModeSwitch';
import { Link } from 'react-router-dom';

const Sidebar = () => {
    const { token } = useAuth();
    const [showMenuLabel, setShowMenuLabel] = useState(false);

    const handleToggle = (e) => {
        console.log(e);
    }

    return (
    <aside className="sidebar my-sidebar bg-slate-100 dark:bg-slate-800 h-full flex flex-col justify-between fixed top-0 left-0 p-4">
      <div>
        <div className="flex items-center justify-center h-16">
          <Link to="/" className="nav-link flex items-center py-2 px-4 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md">

            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">A</h1>
          </Link>
        </div>
        <nav className="mt-8 dark:text-white">
          <Link to="/groups" className="nav-link flex items-center py-2 px-4 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md">
            <FiHome className="h-6 w-6 text-black" />
            <span className="ml-3 text-sm font-medium text-black">Home</span>
          </Link>
          <Link to="/sentence" className="nav-link flex items-center py-2 px-4 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md mt-2">
            <FiEdit3 className="h-6 w-6 text-black" />
            <span className="ml-3 text-sm font-medium text-black">Feedback Editor</span>
          </Link>
          <Link to="/about-us" className="nav-link flex items-center py-2 px-4 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md mt-2">
            <FiInfo className="h-6 w-6 text-black" />
            <span className="ml-3 text-sm font-medium text-black">About Us</span>
          </Link>
          <Link to="/pricing" className="nav-link flex items-center py-2 px-4 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md mt-2">
            <FiCreditCard className="h-6 w-6 text-black" />
            <span className="ml-3 text-sm font-medium text-black">Pricing</span>
          </Link>
        </nav>
      </div>
      <div className="mb-4">
        <div className='flex justify-center'>
            <DarkModeSwitch onToggle={() => {}} />
        </div>
        {/* <a href="#" className="nav-link flex items-center py-2 px-4 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md mt-2">
          <FiLogOut className="h-6 w-6" />
          <span className="ml-3 text-sm font-medium">Log Out</span>
        </a> */}
        {token ? 
        <Link to='/logout' className="nav-link flex items-center py-2 px-4 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md mt-2">
            <FiLogOut className="text-danger h-6 w-6" />
            <span className="ml-3 text-sm font-medium text-danger">Logout</span>
        </Link>
        : null}
      </div>
    </aside>);
};

export default Sidebar;
