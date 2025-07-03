import React from 'react';
import ReactDOM from 'react-dom';

const DropdownPortal = ({ children }) => {
    return ReactDOM.createPortal(
        <div onClick={(e) => e.stopPropagation()}>
            {children}
        </div>,
        document.body
    );
};

export default DropdownPortal;