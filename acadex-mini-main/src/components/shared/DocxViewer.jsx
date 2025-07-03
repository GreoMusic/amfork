import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../provider/authProvider';
import { postReuest, fetchDocxFile } from '../../services/apiService';
import mammoth from 'mammoth';
import './DocViewer.css';

const DocxViewer = ({ filename }) => {
  const [docContent, setDocContent] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    setDocContent(null);
    console.log('filename', filename);
    fetchDocxFile(token, filename)
    .then((response) => {
        mammoth.convertToHtml({ arrayBuffer: response.data })
          .then((result) => {
            setDocContent(result.value);
          })
          .catch((error) => {
            console.error('Error converting DOCX to HTML:', error);
          });
      })
      .catch((error) => {
        console.error('Error fetching the DOCX file:', error);
      });
  }, [filename, token]);

  return (
    <div className='docx-viewer'>
      {docContent ? <div dangerouslySetInnerHTML={{ __html: docContent }} /> : 'Loading...'}
    </div>
  );
};

export default DocxViewer;
