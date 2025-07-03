import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
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

  return (
    <div className="w-full px-4 md:w-1/2 xl:w-1/3 rounded-4xl" key={group.id}>
      <div className="mb-10 overflow-hidden rounded-lg bg-white shadow-3 duration-300 hover:shadow-3 dark:bg-dark-2 dark:shadow-card dark:hover:shadow-3 dark:border-strokedark dark:bg-boxdark">
        {moment(group.created_at).isSame(moment(), 'day') && (
          <span className='text-success float-right p-4 font-bold text-xs'>NEW</span>
        )}
        <div className="p-8 text-center sm:p-9 md:p-7 xl:p-9">
          {isEditing ? (
            <>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mb-4 text-2xl w-full border p-2 rounded-md"
                autoFocus
              />
              <select
                value={gradeType}
                onChange={(e) => setGradeType(e.target.value)}
                className="mb-7 text-left text-2xl leading-relaxed text-body-color w-full border p-1 rounded-md"
              >
                {gradeTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={gradeYear}
                onChange={(e) => setGradeYear(e.target.value)}
                className="mb-7 text-left text-2xl leading-relaxed text-body-color w-full border p-1 rounded-md"
              >
                {gradeYearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="mb-4 text-2xl w-full border p-2 rounded-md"
                autoFocus
              />
              <button
                onClick={handleSave}
                className="inline-block rounded-full bg-success border border-gray-3 px-7 py-2 text-base font-medium text-white transition hover:bg-secondary hover:text-black dark:border-dark-3 dark:text-dark-6"
              >
                Save & Regrade
              </button>
              <button
                onClick={handleCancel}
                className="inline-block ml-4 rounded-full bg-danger border border-gray-3 px-7 py-2 text-base font-medium text-white transition hover:bg-secondary hover:text-black dark:border-dark-3 dark:text-dark-6"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className='dark:text-secondary float-right text-primary font-medium ml-4' onClick={() => handleDelete(group)}>
                <FiTrash2 className="mb-2 text-2xl cursor-pointer text-danger" />
              </button>
              <button className='dark:text-secondary float-right text-primary font-medium' onClick={() => handleEdit(group)}>
                <FiEdit2 className="mb-2 text-2xl cursor-pointer" />
              </button>
              <h1 className='text-black text-2xl font-bold mb-4 cursor-pointer' onClick={() => setIsEditing(false)}>
                {title}
              </h1>
              <p className="mb-7 text-left text-base leading-relaxed text-body-color ml-6 dark:text-white">
                Response type: <span className='text-black font-bold'>{gradeType}</span>
              </p>
              <p className="mb-7 text-left text-base leading-relaxed text-body-color ml-6 dark:text-white">
                Evaluation Level: <span className='text-black font-bold'>{gradeYear}</span>
              </p>
              <Link
                to={`/group/${group.id}/files`}
                className="inline-block rounded-full bg-primary border border-gray-3 px-7 py-2 text-base font-medium text-white transition hover:bg-secondary hover:text-black dark:border-dark-3 dark:text-dark-6"
              >
                View Details
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupCard;
