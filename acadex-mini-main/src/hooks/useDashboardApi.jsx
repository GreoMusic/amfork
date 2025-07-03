import { useCallback } from 'react';
import { getReuest, postReuest, packages } from '../services/apiService';
import ToastAlert from '../pages/components/ToastAlert';
import moment from 'moment';

export const useDashboardApi = (token, group_id) => {
    const host = window.location.hostname;
    const siteUrl = host === 'localhost'
        ? import.meta.env.VITE_API_URL
        : import.meta.env.VITE_API_URL_PROD;
    const apiUrl = siteUrl + '/api';

    const fetchFiles = useCallback(async () => {
        const res = await getReuest(`files-by-group/${group_id}`, token);
        return res;
    }, [group_id, token]);

    const fetchMyUsage = useCallback(async () => {
        const res = await getReuest('my-usage', token);
        return res;
    }, [token]);

    const analyzePaper = useCallback((group, file) => {
        if (file.content?.length) {
            const prompt = `
        Your task is to provide a detailed pre-analysis of a student’s paper based on the following inputs:
        1. Assignment Name: ${group.title}
        2. Assignment Description: ${group.about_assignment}
        3. Rubric: ${group.criteria}
        4. “Look Out For”: ${group.look_out}
        5. The ${group.grade_year} student’s paper: **paper start** ${file.content} **paper end**
        6. Total Point Scale: 0 to ${group.total_points}
        Your goal is to conduct a strict and critical analysis of the paper...
      `;
            return postReuest({ prompt, file_id: file.id }, 'create/pre-analysis', token);
        } else {
            ToastAlert('Warning', 'No content in the file.', "1");
            return Promise.resolve();
        }
    }, [token]);

    const callOpenAi = useCallback(async (file_id, isSydneyPlusEnabled, isGoldUser) => {
        const res = await getReuest(
            `evaluate/paper/${file_id}/${isSydneyPlusEnabled && isGoldUser ? 1 : 0}`,
            token
        );
        updateUsage(1);
        return res;
    }, [token]);



    const updateFile = useCallback((obtainedPoints, selectedFileId) => {
        postReuest({ file_id: selectedFileId, obtained_points: obtainedPoints }, 'update/file', token).then(res => {
            setIsProcessing(false);
            setShowModal(false);
            setResponse('');
            fetchFiles(group_id, token)

        }).catch(err => {
            console.error('err', err);
        });
    }, [token]);

    const updateUsage = useCallback((evaluation_count) => {
        const data = { upload_count: 0, evaluation_count };
        postReuest(data, `my-usage/create-update`, token).then(res => {
            // setProfile(res.user);
            // setClientSecret(res.payment.client_secret)
            // setClientSecret('')
            console.log('res', res);
        }).catch(err => {

            console.error('err', err);
        });
    }, [token]);

    const evaluateMultiple = useCallback((idStr, group_id) => {
        return postReuest({ file_ids: idStr }, 'evaluate/multiple', token);
    }, [token]);

    return { apiUrl, fetchFiles, fetchMyUsage, analyzePaper, callOpenAi, updateFile, evaluateMultiple, updateUsage };
};