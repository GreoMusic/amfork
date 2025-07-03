

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { FiEdit3, FiTrash2, FiEye } from 'react-icons/fi';
import { postReuest } from '../../services/apiService';
import { useAuth } from '../../provider/authProvider';
import ToastAlert from './ToastAlert';


const gradeYearOptions = [
    'K-6', 
    '6th Grade', 
    '7th Grade', 
    '8th Grade', 
    '9th Grade', 
    '10th Grade', 
    '11th Grade', 
    '12th grade',
    'College',
];

const gradeTypeOptions = ['Flexible', 'Normal', 'Critical'];

const GroupCard = ({ group, onSave, showEdit, refetchGroups }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(group.title);
  const [gradeType, setGradeType] = useState(group.grade_type);
  const [gradeYear, setGradeYear] = useState(group.grade_year);
  const [total, setTotal] = useState(group.total_points);
  const { token } = useAuth();

  const handleSave = () => {
    delete(group['created_at']);
    delete(group['updated_at']);
    onSave({...group, title, grade_type: gradeType, grade_year: gradeYear, total_points: total});
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(group.title);
    setGradeType(group.grade_type);
    setGradeYear(group.grade_year);
    setTotal(group.total_points);
    setIsEditing(false);
  };

  const handleEdit = (group) => {
    showEdit(group);
    window.scrollTo({top: 0, behavior: "smooth"});
  }

  const handleDelete = (group) => {
    const c = confirm('Deleting Assessment "'+group.title+'"!\n\nAre you sure?')
    if(c){
      console.log(group);
      postReuest({group_id: group.id}, `delete/group`, token).then(res => {
        console.log('Assessment delete', res);
        if (res.error) {
          ToastAlert('Error deleting Assessment!', res.error, "2");
  
        } else {
          ToastAlert('Successful!', "Assessment deleted successfully!", "0");
          refetchGroups();
        }
        // refetchFiles();
      });

    } else {
      console.log('Not delete')
    }
  }
  const isNew = moment(group.created_at).isSame(moment(), 'day');

  return (
    <div className={`assessment-wrapper bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-slate-700 p-6 relative overflow-hidden ${isNew ? 'new-assessment' : ''}`}>
        <h3 className="text-xl font-semibold text-center mb-4 text-black dark:text-white">{title}</h3>
        <p className="text-black dark:text-white"><strong>Grade Type:</strong> {group.grade_type}</p>
        <p className="text-black dark:text-white"><strong>Grade Year:</strong> {group.grade_year}</p>
        <div className="absolute top-4 right-4 flex space-x-2">
            <FiEdit3 className="h-5 w-5 text-blue-500 hover:text-blue-700 cursor-pointer" onClick={() => handleEdit(group)} />
            <FiTrash2 className="h-5 w-5 text-red-500 hover:text-red-700 cursor-pointer" onClick={() => handleDelete(group)} />
        </div>
        <div className="mt-4 flex justify-center">

            <Link
                to={`/group/${group.id}/files`} className="px-4 py-2 ml-6 px-4 mt-3 bg-gradient-to-r from-[#4B0082] to-[#A855F7] rounded-md text-slate-100 font-medium transition-colors duration-300 button-gradient flex items-center">
                <FiEye className="h-5 w-5 mr-2" />
                View Details
            </Link>
        </div>
  </div>
  );
};

export default GroupCard;
