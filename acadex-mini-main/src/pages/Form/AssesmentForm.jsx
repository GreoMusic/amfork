import React, { useEffect, useRef, useState } from 'react';
import { getUser, useAuth } from "../../provider/authProvider";
import { postReuest } from "../../services/apiService";
import ToastAlert from '../components/ToastAlert';
import TagInput from '../../components/shared/TagInput';
import FileToTextarea from '../components/FileToTextarea';
import { FiChevronLeft as ChevronLeft, FiChevronRight as ChevronRight } from "react-icons/fi";
import GradeSampleForm from './GradeSampleForm';
import MainLayout from '../../layout/MainLayout';
import LoadingOverlay from '../../layout/LoadingOverlay';
import LoadingComponent from '../../layout/LoadingComponent';

const gradeYearOptions = [
    'K-6', '6th Grade', '7th Grade', '8th Grade', '9th Grade', 
    '10th Grade', '11th Grade', '12th grade', 'College',
];

const gradeTypeOptions = ['Flexible', 'Normal', 'Critical'];

const AssesmentForm = ({ group, handleReload, closeForm }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const [isProcessing, setIsProcessing] = useState(false);
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
  const [errors, setErrors] = useState({});
  const { token } = useAuth();
  const user = getUser().user;
  const [groupId, setGroupId] = useState(0);

  useEffect(() => {
    if (group) {
      const criteria = group.criteria;
      setFormData({
        id: group.id,
        title: group.title,
        criteria: criteria,
        look_out: group.look_out,
        gradeYear: group.grade_year,
        gradeType: group.grade_type,
        about_assignment: group.about_assignment,
        totalPoints: group.total_points,
      });
      setGroupId(group.id);
    }
  }, [group]);
  const gradeSampleFormRef = useRef();

  const validateStep = (step) => {
    const newErrors = {};
    switch (step) {
      case 1:
        if (!formData.title?.trim()) newErrors.title = 'Title is required';
        if (!formData.totalPoints) {
          newErrors.totalPoints = 'Total Points is required';
        } else if (isNaN(formData.totalPoints) || formData.totalPoints <= 0) {
          newErrors.totalPoints = 'Total Points must be a positive number';
        }
        break;
      case 2:
        if (!formData.about_assignment?.trim()) {
          newErrors.about_assignment = 'About assignment description is required';
        } else if (formData.about_assignment.length > 1000) {
          newErrors.about_assignment = 'The Character limit(1000 characters) has been reached or exceeded for "Assignment Details". Please shorten it';
        }
        break;
      case 3:
        if (!formData.criteria?.trim()) newErrors.criteria = 'Criteria is required';
        break;
      case 4:
        if (!formData.look_out?.trim()) {
          newErrors.look_out = 'Look out is required';
        } else if (formData.look_out.length > 5000) {
          newErrors.look_out = 'The Character limit(5000 characters) has been reached or exceeded for Look Out. Please shorten it';
        }
        break;
      case 5:
        if (!formData.gradeYear?.trim()) newErrors.gradeYear = 'Grade year is required';
        break;
      case 6:
        if (!formData.gradeType?.trim()) newErrors.gradeType = 'Grade type is required';
        break;
      // Step 7 doesn't need validation as it's the final step
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      ToastAlert('Warning', 'Please fill in all required fields correctly before proceeding.', '1');
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    setIsProcessing(true);

    if (validateStep(currentStep)) {
      const post_data = { 
        id: formData.id, 
        title: formData.title, 
        criteria: formData.criteria, 
        look_out: formData.look_out, 
        about_assignment: formData.about_assignment, 
        grade_type: formData.gradeType, 
        grade_year: formData.gradeYear, 
        total_points: formData.totalPoints, 
        teacher_user_id: user.id 
      };

      // If the main form submission is successful, submit the GradeSampleForm

      postReuest(post_data, 'submit/group', token).then(res => {
        console.log(res);
        setGroupId(res.group.id);
        ToastAlert('Success', `Assessment ${group?.id ? 'updated' : 'created'}!`, "0");
        // setTimeout(() => handleReload(), 500);
        nextStep();
        setIsProcessing(false);
      }).catch(err => {
        console.error(err);
        ToastAlert('Error', 'Failed to submit assessment', "2");
        setIsProcessing(false);
      });
    } else {
      setIsProcessing(false);
      ToastAlert('Warning', `Assessment has a validation error!`, "1");
    }
  };

  const handleFileSelect = (str) => {
    setFormData({ ...formData, criteria: str });
  };

  const handleGradeSampleSubmit = async (e) => {
    console.log(gradeSampleFormRef.current)
    console.log(gradeSampleFormRef.current.handleSubmitGradeSample)
    
    if (gradeSampleFormRef.current && typeof gradeSampleFormRef.current.handleSubmitGradeSample === 'function') {
        await gradeSampleFormRef.current.handleSubmitGradeSample();
      }
  }

  

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h3 className="text-2xl font-semibold mb-4">Step 1: {group?.id ? 'Update' : 'Create an'} Assessment Title</h3>
            <div className="mb-4">
                <label htmlFor="assessmentTitle" className="block mb-2">Assessment Title</label>
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
                <label htmlFor="totalPoints" className="block text-sm font-medium text-gray-700 dark:text-white mt-6">
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
          </div>
        );
        case 2:
          return (
            <div className="step-content">
              <h3 className="text-2xl font-semibold mb-4">Step 2: Assessment Details</h3>
              <div className="mb-4">
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
            </div>
          );
          case 3:
            return (
              <div className="step-content">
                <h3 className="text-2xl font-semibold mb-4">Step 3: Upload or Provide Rubric</h3>
                <div className="mb-4">
                    <label htmlFor="criteria" className="block text-sm font-medium text-gray-700 dark:text-white">
                        Rubric <span >({formData.criteria?.length ?? 0})</span>
                    </label>
                    <FileToTextarea onFileSelect={handleFileSelect} />
                    <textarea
                        id="criteria"
                        name="criteria"
                        rows={8}
                        value={formData.criteria}
                        onChange={handleChange}
                        className={`mt-1 p-2 w-full border rounded-md ${errors.criteria ? 'border-red-500' : ''
                            }`}
                    />
                    {errors.criteria && (
                        <p className="text-danger text-sm mt-1">{errors.criteria}</p>
                    )}
                </div>
              </div>
            );
            case 4:
              return (
                <div className="step-content">
                    <h3 className="text-2xl font-semibold mb-4">Step 4: Look Out For</h3>
                    <label htmlFor="criteria" className="block text-sm font-medium text-gray-700 dark:text-white">
                        Look out for <span className={`${formData.look_out?.length > 5000 ? 'text-danger' : 'text-success'}`}>({formData.look_out?.length ?? 0})</span>
                    </label>
                  <div className="mb-4">
                    
                    
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
                </div>
              );
              case 5:
                return (
                  <div className="step-content">
                    <h3 className="text-2xl font-semibold mb-4">Step 5: Grade Year</h3>

                    <label htmlFor="gradeYear" className="block text-sm font-medium text-gray-700 dark:text-white">
                        Grade Year
                    </label>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
                        {gradeYearOptions.map((option) => (
                            <a key={option} onClick={() => { setFormData({ ...formData, gradeYear: option }); setErrors({ ...errors, gradeYear: '' }); }} className={`[word-wrap: break-word] my-[5px] flex h-[32px] cursor-pointer items-center justify-center rounded-[16px] bg-[#eceff1] px-[12px] py-0 text-[13px] font-normal normal-case leading-loose text-[#4f4f4f] shadow-none transition-[opacity] duration-300 ease-linear hover:!shadow-none active:bg-[#cacfd1] dark:bg-neutral-600 dark:text-neutral-200 ${formData.gradeYear == option ? '!bg-violet-600 text-white' : ''}`}>
                                {option}
                            </a>
                        ))}
                    </div>
                    {errors.gradeYear && (
                        <p className="text-danger text-sm mt-1">{errors.gradeYear}</p>
                    )}
                  </div>
                );
                case 6:
                  return (
                    <div className="step-content">
                        <h3 className="text-2xl font-semibold mb-4">Step 6: Grading Style</h3>

                        <label htmlFor="gradeType" className="block text-sm font-medium text-gray-700 dark:text-white">
                            Grade Type
                        </label>
                        <div className='grid grid-cols-1 sm:grid-cols-3'>
                            {gradeTypeOptions.map((option) => (
                                <a key={option} onClick={() => { setFormData({ ...formData, gradeType: option }); setErrors({ ...errors, gradeType: '' }); }} className={`[word-wrap: break-word] my-[5px] mr-4 flex h-[32px] cursor-pointer items-center justify-center rounded-[16px] bg-[#eceff1] px-[12px] py-0 text-[13px] font-normal normal-case leading-loose text-[#4f4f4f] shadow-none transition-[opacity] duration-300 ease-linear hover:!shadow-none active:bg-[#cacfd1] dark:bg-neutral-600 dark:text-neutral-200 ${formData.gradeType === option ? '!bg-violet-600 text-white' : ''}`}>
                                    {option}
                                </a>
                            ))}
                        </div>
                        {errors.gradeType && (
                            <p className="text-danger text-sm mt-1">{errors.gradeType}</p>
                        )}
                    </div>
                  );
                  case 7:
                    return (
                      <div className="step-content">
                        <h3 className="text-2xl font-semibold mb-4">Step 7: Final Uploads</h3>
                        <GradeSampleForm setIsProcessing={setIsProcessing} group_id={groupId} ref={gradeSampleFormRef} handleReload={() => setTimeout(() => handleReload(), 500)} />
                      </div>
                    );
      // ... Add cases for steps 3-7 here
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <LoadingComponent isLoading={isProcessing} />
      <div className="relative w-full bg-white p-8 rounded-lg shadow-md overflow-hidden">
        <button onClick={closeForm} className="absolute top-4 right-4 text-xl font-medium text-white hover:text-gray-800 bg-red-500 hover:bg-red-600 px-4 py-2 rounded">Cancel</button>
        
        <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">{group?.id ? 'Update' : 'Create an'} Assessment</h1>
        
        {/* Progress indicators */}
        <div className="flex justify-between mb-8">
          {Array.from({length: totalSteps}, (_, i) => i + 1).map((step, index) => (
            <React.Fragment key={step}>
            <div className="flex flex-col items-center flex-1">
              <div className={`w-12 h-12 flex items-center justify-center rounded-full ${
                step <= currentStep ? 'bg-violet-600' : group?.id ? 'bg-purple-300 cursor-pointer' : 'bg-gray-4'
              } text-white mb-2 transition-all duration-300 ${
                step === currentStep ? 'scale-110' : ''
              }`} onClick={() => group?.id ? setCurrentStep(step) : () => {}}>
                {step}
              </div>
              <span className="text-sm text-center">
                {[`${group?.id ? 'Update' : 'Create'} Title`, 'Assessment Details', 'Upload Rubric', 'Look Out For', 'Grade Year', 'Grading Style', 'Final Uploads'][step - 1]}
              </span>
            </div>
            {step < totalSteps ? <div className={`flex-1 border-t-2 ${step+1 > currentStep ? 'border-purple-200' : 'border-purple-500'} `}></div> : null}
            </React.Fragment>
          ))}
        </div>
        
        <div className="relative h-auto min-h-[400px]">
          {renderStepContent()}
        </div>
        
        <div className="flex justify-between mt-6">
          {currentStep > 1 && ( 
            <button onClick={prevStep} className="flex items-center text-purple-600 hover:text-purple-800">
              <ChevronLeft size={20} />
              Back
            </button>
          )}
          {currentStep >= totalSteps || group?.id ? (
            <button onClick={handleSubmit} className="text-xl bg-purple-900 text-white px-4 py-2 rounded hover:bg-purple-700 ml-auto">
              SAVE
            </button>
          ) : null }
          {/* ) : ( */}

          <button onClick={currentStep == totalSteps-1 ? handleSubmit : nextStep} className="flex items-center text-xl bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-800 ml-auto">
              Next
              <ChevronRight size={20} />
            </button>
          {/* )} */}
        </div>
      </div>
    </MainLayout>
  );
};

export default AssesmentForm;