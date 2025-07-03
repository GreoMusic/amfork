import React, { useEffect, useState } from 'react';
import { getUser, useAuth } from "../../provider/authProvider";
import { postReuest } from "../../services/apiService";
import ToastAlert from '../components/ToastAlert';
import TagInput from '../../components/shared/TagInput';
import FileToTextarea from '../components/FileToTextarea';

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

const FormComponent = ({ group, handleReload, closeForm }) => {

    const [formData, setFormData] = useState({
        id: '',
        title: '',
        criteria: '',
        look_out: '',
        about_assignment: '',
        gradeYear: '',
        gradeType: 'Normal',
        totalPoints: '',
    });
    const [tags, setTags] = useState([]);
    const { token } = useAuth();
    const user = getUser().user;


    const [errors, setErrors] = useState({});

    useEffect(() => {
        setTags([]);
        if(group){
            const criteria = group.criteria;
            // if(criteria[1])
            //     setTags(criteria[1].split(','));
            setFormData({
                id: group.id,
                title: group.title,
                criteria: criteria,
                look_out: group.look_out,
                gradeYear: group.grade_year,
                gradeType: group.grade_type,
                about_assignment: group.about_assignment,
                totalPoints: group.total_points,
            })
        }
    }, [group]);

    // Function to handle form submission
    const submitGroup = (data) => {
        // setError('');

        postReuest(data, 'submit/group', token).then(res => {
            console.log(res);
            ToastAlert('Success', `Assessment ${group?.id ? 'updated' : 'created'}!`, "0")
            setTimeout(() => handleReload(), 500);

            setFormData({
                title: '',
                criteria: '',
                look_out: '',
                about_assignment: '',
                gradeYear: '',
                gradeType: '',
                totalPoints: '',
            })
        });
        console.log('Title submitted:', title);
        // You can add further logic for handling the submitted title
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: '' }); // Clear error message on input change
    };

    const handleSubmit = (e) => {
        console.log(formData)
        e.preventDefault();

        // Basic form validation
        const newErrors = {};
        if (!formData.title?.trim()) {
            newErrors.title = 'Title is required';
        }
        if (!formData.criteria?.trim()) {
            newErrors.criteria = 'Criteria is required';
        }
        if (formData.about_assignment==null || !formData.criteria?.trim()) {
            newErrors.about_assignment = 'About assignment description is required';
        }
        else if(formData.about_assignment.length > 1000){
            newErrors.about_assignment = 'The Character limit(1000 characters) has been reached or exceeded for “Assignment Details”. Please shorten it';
        }
        if (formData.look_out==null || !formData.look_out?.trim()) {
            newErrors.look_out = 'Look out is required';
        }
        else if(formData.look_out.length > 5000){
            newErrors.look_out = 'The Character limit(5000 characters) has been reached or exceeded for Look Out. Please shorten it';
        }
        if (!formData.gradeType.trim()) {
            newErrors.gradeType = 'Grade type is required';
        }
        if (!formData.gradeYear.trim()) {
            newErrors.gradeYear = 'Gread year is required';
        }
        if (!formData.totalPoints) {
            newErrors.totalPoints = 'Total Points is required';
        } else if (isNaN(formData.totalPoints) || formData.totalPoints <= 0) {
            newErrors.totalPoints = 'Total Points must be a positive number';
        }
        console.log(newErrors);
        setErrors(newErrors);
        // return false;


        // If no errors, proceed with form submission
        if (Object.keys(newErrors).length === 0) {
            const post_data = { id: formData.id, title: formData.title, criteria: formData.criteria, look_out: formData.look_out, about_assignment: formData.about_assignment, grade_type: formData.gradeType, grade_year: formData.gradeYear, total_points: formData.totalPoints, teacher_user_id: user.id };
            // console.log('Form submitted:', post_data);return
            submitGroup(post_data);
            console.log('Form submitted:', formData);
            // Add your logic for handling the form data submission here
        } else {
            ToastAlert('Warning!', `Assessment ${group?.title} has a validation error!`, "1")

        }
    };

    useEffect(() => {
        console.log('tags', tags)
    }, [tags])

    const handleFileSelect = (str) => {
        console.log(str);
        setFormData({ ...formData, criteria: str });
        
    }

    return (
        <div className="w-4/5 mx-auto mt-4">
            <h1 className='text-center text-3xl dark:text-white'>{group?.id ? "Edit" : "New"} Assessment {group?.title}</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-white">
                        Title <span >({formData.title?.length ?? 0})</span>
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className={`mt-1 p-2 w-full border rounded-md ${errors.title ? 'border-red-500' : ''
                            }`}
                    />
                    {errors.title && (
                        <p className="text-danger text-sm mt-1">{errors.title}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="about_assignment" className="block text-sm font-medium text-gray-700 dark:text-white">
                        Assignment details <span className={`${formData.about_assignment?.length > 1000 ? 'text-danger' : 'text-success'}`}>({formData.about_assignment?.length ?? 0})</span>
                    </label>
                    
                    <textarea
                        type="text"
                        id="about_assignment"
                        name="about_assignment"
                        rows={4}
                        value={formData.about_assignment}
                        onChange={handleChange}
                        className={`mt-1 p-2 w-full border rounded-md ${errors.about_assignment ? 'border-red-500' : ''
                            }`}
                    />

                    {errors.about_assignment && (
                        <p className="text-danger text-sm mt-1">{errors.about_assignment}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="criteria" className="block text-sm font-medium text-gray-700 dark:text-white">
                        Criteria <span >({formData.criteria?.length ?? 0})</span>
                    </label>
                    <textarea
                        id="criteria"
                        name="criteria"
                        rows={8}
                        value={formData.criteria}
                        onChange={handleChange}
                        className={`mt-1 p-2 w-full border rounded-md ${errors.criteria ? 'border-red-500' : ''
                            }`}
                    />
                    <FileToTextarea onFileSelect={handleFileSelect} />
                    {errors.criteria && (
                        <p className="text-danger text-sm mt-1">{errors.criteria}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="criteria" className="block text-sm font-medium text-gray-700 dark:text-white">
                        Look out for <span className={`${formData.look_out?.length > 5000 ? 'text-danger' : 'text-success'}`}>({formData.look_out?.length ?? 0})</span>
                    </label>
                    
                    <textarea
                        type="text"
                        id="look_out"
                        name="look_out"
                        rows={4}
                        value={formData.look_out}
                        onChange={handleChange}
                        className={`mt-1 p-2 w-full border rounded-md ${errors.look_out ? 'border-red-500' : ''
                            }`}
                    />

                    {errors.look_out && (
                        <p className="text-danger text-sm mt-1">{errors.look_out}</p>
                    )}
                </div>



                <div>
                    <label htmlFor="gradeYear" className="block text-sm font-medium text-gray-700 dark:text-white">
                        Grade Year
                    </label>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
                        {gradeYearOptions.map((option) => (
                            <a key={option} onClick={() => { setFormData({ ...formData, gradeYear: option }); setErrors({ ...errors, gradeYear: '' }); }} className={`[word-wrap: break-word] my-[5px] flex h-[32px] cursor-pointer items-center justify-center rounded-[16px] bg-[#eceff1] px-[12px] py-0 text-[13px] font-normal normal-case leading-loose text-[#4f4f4f] shadow-none transition-[opacity] duration-300 ease-linear hover:!shadow-none active:bg-[#cacfd1] dark:bg-neutral-600 dark:text-neutral-200 ${formData.gradeYear === option ? 'bg-primary text-white' : ''}`}>
                                {option}
                            </a>
                        ))}
                    </div>
                    {errors.gradeYear && (
                        <p className="text-danger text-sm mt-1">{errors.gradeYear}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="gradeType" className="block text-sm font-medium text-gray-700 dark:text-white">
                        Grade Type
                    </label>
                    <div className='grid grid-cols-1 sm:grid-cols-3'>
                        {gradeTypeOptions.map((option) => (
                            <a key={option} onClick={() => { setFormData({ ...formData, gradeType: option }); setErrors({ ...errors, gradeType: '' }); }} className={`[word-wrap: break-word] my-[5px] mr-4 flex h-[32px] cursor-pointer items-center justify-center rounded-[16px] bg-[#eceff1] px-[12px] py-0 text-[13px] font-normal normal-case leading-loose text-[#4f4f4f] shadow-none transition-[opacity] duration-300 ease-linear hover:!shadow-none active:bg-[#cacfd1] dark:bg-neutral-600 dark:text-neutral-200 ${formData.gradeType === option ? 'bg-primary text-white' : ''}`}>
                                {option}
                            </a>
                        ))}
                    </div>
                    {errors.gradeType && (
                        <p className="text-danger text-sm mt-1">{errors.gradeType}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="totalPoints" className="block text-sm font-medium text-gray-700 dark:text-white">
                        Total Points
                    </label>
                    <input
                        type="number"
                        id="totalPoints"
                        name="totalPoints"
                        value={formData.totalPoints}
                        onChange={handleChange}
                        className={`mt-1 p-2 w-full border rounded-md ${errors.totalPoints ? 'border-red-500' : ''
                            }`}
                    />
                    {errors.totalPoints && (
                        <p className="text-danger text-sm mt-1">{errors.totalPoints}</p>
                    )}
                </div>

                <button
                    type="submit"
                    className="bg-success text-white px-6 py-1 rounded-md hover:bg-blue-600 font-semibold uppercase text-lg"
                >
                    Save
                </button>
                <button
                    type="button"
                    onClick={closeForm}
                    className="bg-danger text-white mx-4 px-6 py-1 rounded-md hover:bg-blue-600 font-semibold uppercase text-lg"
                >
                    Cancel
                </button>
            </form>
        </div>
    );
};

export default FormComponent;
