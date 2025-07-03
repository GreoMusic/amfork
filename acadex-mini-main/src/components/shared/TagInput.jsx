import React, { useState } from 'react';
import './TagInput.css';

const TagInput = ({ tags, setTags }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue) {
      if (!tags.includes(inputValue)) {
        setTags([...tags, inputValue]);
        setInputValue('');
      }
        e.preventDefault();
    } else if (e.key === 'Backspace' && !inputValue && tags.length) {
      const newTags = [...tags];
      newTags.pop();
      setTags(newTags);
    }
  };

  const handleRemoveTag = (index) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };

  return (
    <div className="tag-input">
      {tags.map((tag, index) => (
        <div className="tag" key={index}>
          {tag}
          <span className="tag-close" onClick={() => handleRemoveTag(index)}>
            &times;
          </span>
        </div>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type and press Enter"
      />
    </div>
  );
};

export default TagInput;
