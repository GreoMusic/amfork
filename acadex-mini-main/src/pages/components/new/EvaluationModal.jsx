import React, { useMemo } from 'react';
import { FiX } from 'react-icons/fi';
import Collapsible from '../../../components/shared/Collapsible';
import PDFViewerModal from '../PDFViewerModal';
import DocxViewer from '../../../components/shared/DocxViewer';

export const EvaluationModal = ({
    isOpen,
    onClose,
    analysis,
    response,
    obtainedPoints,
    onPointsChange,
    onSave,
    isPdf,
    selectedPdfFile,
    selectedPdfFilePath,
}) => {
    if (!isOpen) return null;



    const getFileContent = useMemo(() => {
        if (selectedPdfFile && isPdf) {
            return <PDFViewerModal file={selectedPdfFile} isPdf={isPdf} />;
        }
        return <DocxViewer filename={selectedPdfFilePath} />;
    }, [selectedPdfFile, selectedPdfFilePath, isPdf]);

    return (
        <>
            <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
                <div className="relative w-full my-6 mx-auto sm:mx-12 lg:mx-24">
                    <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white dark:bg-gray-800 outline-none focus:outline-none">
                        {/* Header */}
                        <div className="flex items-start justify-between p-5 border-b border-solid border-gray-200 rounded-t">
                            <h3 className="w-1/2 text-3xl font-semibold">
                                Sydney response
                            </h3>
                            <div className="w-1/2 flex items-start justify-between">
                                <h3 className="text-3xl font-semibold">
                                    File Content
                                </h3>
                                <button
                                    className="p-1 ml-auto text-black float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                                    onClick={onClose}
                                >
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex">
                            <div className="w-1/2">
                                <div className="relative p-6 flex-auto">
                                    <div className="my-4 text-blueGray-500 text-lg leading-relaxed max-h-[450px] overflow-y-scroll">
                                        <Collapsible title="Pre-Analysis" isCollapsed={true} classes="mt-6 mb-2">
                                            <div
                                                className="bg-gray dark:bg-black text-black p-2"
                                                dangerouslySetInnerHTML={{ __html: analysis?.replace(/\n/g, '<br />') }}
                                            />
                                        </Collapsible>
                                        <Collapsible title="AI Response" isCollapsed={false} classes="mb-2">
                                            <div
                                                className="bg-gray dark:bg-black text-black p-2"
                                                dangerouslySetInnerHTML={{ __html: response?.replace(/\n/g, '<br />') }}
                                            />
                                        </Collapsible>
                                    </div>

                                    <div>
                                        <label htmlFor="points" className="block text-sm font-medium text-black">
                                            Points
                                        </label>
                                        <input
                                            type="number"
                                            id="points"
                                            value={obtainedPoints}
                                            onChange={(e) => onPointsChange(e.target.value)}
                                            className="mt-1 p-2 w-full border rounded-md"
                                            required
                                        />
                                    </div>
                                </div>

                                {obtainedPoints == 0 && (
                                    <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4" role="alert">
                                        <p className="font-bold">Be Warned</p>
                                        <p>Sydney response grade not updated! Update Grade.</p>
                                    </div>
                                )}

                                <button
                                    disabled={obtainedPoints < 1}
                                    className={`${obtainedPoints < 1 ? 'bg-gray dark:bg-graydark text-black' : 'bg-primary text-white'} 
                                        float-right active:bg-emerald-600 font-bold uppercase text-sm px-6 py-3 rounded 
                                        shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150`}
                                    onClick={onSave}
                                >
                                    Save Changes
                                </button>
                            </div>

                            <div className="w-1/2">
                                <div className="relative p-6 flex-auto max-h-[600px] overflow-y-scroll text-black">
                                    {getFileContent}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                            <button
                                className="bg-danger text-white background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                                onClick={onClose}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
    );
};