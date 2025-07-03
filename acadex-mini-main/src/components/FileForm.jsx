import React, { useState } from 'react';
import axios from 'axios';
import ToastAlert from '../pages/components/ToastAlert';

const Form = () => {
    // state to store the selected file.
    const [selectedFile, setSelectedFile] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Create a FormData object
        const formData = new FormData();

        // Append file to the formData object here
        formData.append("selectedFile", selectedFile);

        try {
            // We will send formData object as a data to the API URL here.
            const response = await axios.post("http://localhost:8000/api/upload/pdf", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            }).then((res) => {
                ToastAlert('Success', "File Uploaded Successfully!", "0")
            }).catch((error) => {
                ToastAlert('Error', "Something went wrong!", "2")
            });
        } catch (error) {
            console.log(error)
        }
    }

    const handleFileSelect = (event) => {
        // we only get the selected file from input element's event
        setSelectedFile(event.target.files[0])
    }

    return (
        <form onSubmit={handleSubmit}>
            <input type="file" onChange={handleFileSelect} />
            <input type="submit" value="Upload File" />
        </form>
    )
};

export default Form;
