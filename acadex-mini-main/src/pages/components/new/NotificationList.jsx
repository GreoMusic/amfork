import React, { useState, useRef, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const NotificationList = ({ group = {}, mySubscription = {}, isDemoTrialEnded = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [notifications, setNotifications] = useState([]);

    // Update notifications (remove extra logging)
    useEffect(() => {
        const newNotifications = [];
        if (group && !group.about_assignment) {
            newNotifications.push({
                id: 1,
                type: 'error',
                message: (
                    <>
                        <span className="font-medium">No description for the assignment!</span> Please{' '}
                        <Link to={`/groups?edit=${group.id}`}><span className='underline'>Edit group</span></Link>{' '}
                        to provide assignment details.
                    </>
                )
            });
        }
        if (mySubscription?.stripe_status !== 'active') {
            newNotifications.push({
                id: 2,
                type: 'error',
                message: (
                    <>
                        <span className="font-medium">No subscription!</span> Please subscribe via{' '}
                        <Link to="/pricing"><span className='underline'>Click here</span></Link>.
                    </>
                )
            });
        } else {
            newNotifications.push({
                id: 3,
                type: 'success',
                message: (
                    <>
                        <span className="font-medium">Thank you!</span> For subscribing with the {mySubscription.type} package.
                    </>
                ),
                read: true
            });
        }
        if (isDemoTrialEnded) {
            newNotifications.push({
                id: 4,
                type: 'error',
                message: <span className='text-danger font-medium'>Trial period ended</span>
            });
        }
        setNotifications(newNotifications);
    }, [group, mySubscription, isDemoTrialEnded]);

    // Count total notifications and unread notifications
    const count = notifications.length;
    const unreadCount = notifications.filter(notification => !notification.read).length;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <div className="cursor-pointer w-8 float-right relative" onClick={() => setIsOpen(!isOpen)}>
                <FaBell className="text-2xl text-gray-700 hover:text-gray-900 dark:text-gray dark:hover:text-white transition-colors" />
                {count > 0 && (
                    <div
                        className={`absolute -top-2 -right-2 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold ${unreadCount > 0 ? 'bg-red-500 text-white' : 'bg-gray-500 text-gray-200'
                            }`}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount || count}
                    </div>
                )}
            </div>

            {/* Dropdown Notifications */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50 transition-all duration-200 ease-in-out">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold dark:text-white">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`px-4 py-3 hover:bg-gray-100 dark:hover:bg-black cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-graydark' : ''
                                    }`}
                            >
                                <p className="text-sm dark:text-white">{notification.message}</p>
                                <p className="text-xs text-gray-500 dark:text-white mt-1">{notification.time}</p>
                            </div>
                        ))}
                    </div>
                    <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 dark:hover:bg-black">
                        <button className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400">
                            Mark all as read
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationList;