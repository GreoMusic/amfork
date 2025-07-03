import React, { useState, useEffect } from 'react';
import { pdfjs } from 'react-pdf';
import { read, utils } from 'xlsx'; // Excel handling
import mammoth from 'mammoth'; // DOCX handling using mammoth

// Set the workerSrc for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const FileToTextarea = ({label, onFileSelect}) => {
    const [file, setFile] = useState(null);
    const [textContent, setTextContent] = useState('');

    // Handle file upload
    const handleFileChange = (event) => {
        const uploadedFile = event.target.files[0];
        if (uploadedFile) {
            setFile(uploadedFile);
        }
    };

    // Extract text based on file type
    useEffect(() => {
        const extractText = async () => {
            if (!file) return;

            const fileType = file.type;

            if (fileType === 'application/pdf') {
                // PDF file handling
                const fileReader = new FileReader();
                fileReader.onload = async () => {
                    const loadingTask = pdfjs.getDocument({ data: fileReader.result });
                    const pdf = await loadingTask.promise;

                    let text = '';
                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map((item) => item.str).join(' ');
                        text += pageText + '\n';
                    }

                    setTextContent(text);
                };
                fileReader.readAsArrayBuffer(file);
            } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                // DOCX file handling
                const fileReader = new FileReader();
                fileReader.onload = async (e) => {
                    const arrayBuffer = e.target.result;

                    try {
                        const { value: docxText } = await mammoth.extractRawText({ arrayBuffer });
                        setTextContent(docxText);
                    } catch (error) {
                        console.error('Error extracting text from DOCX file:', error);
                        setTextContent('Error extracting text from DOCX file');
                    }
                };
                fileReader.readAsArrayBuffer(file);
            } else if (
                fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                fileType === 'application/vnd.ms-excel'
            ) {
                // Excel file handling
                const fileReader = new FileReader();
                fileReader.onload = (e) => {
                    const arrayBuffer = e.target.result;
                    const workbook = read(arrayBuffer, { type: 'array' });
                    let text = '';
                    workbook.SheetNames.forEach((sheetName) => {
                        const worksheet = workbook.Sheets[sheetName];
                        const sheetText = utils.sheet_to_csv(worksheet);
                        text += sheetText + '\n';
                    });
                    setTextContent(text);
                };
                fileReader.readAsArrayBuffer(file);
            } else {
                setTextContent('Unsupported file type');
            }
        };

        extractText();
    }, [file]);

    useEffect(() => {
        console.log('textContent', textContent)
        if(textContent.length){
            onFileSelect(textContent)
        }
    }, [textContent])

    return (
        <div className="container">
            <h1>{label?.length ? label : 'Upload Rubric'}</h1>
            <input type="file" accept=".pdf,.docx,.xlsx" onChange={handleFileChange} />
        </div>
    );
};

export default FileToTextarea;
