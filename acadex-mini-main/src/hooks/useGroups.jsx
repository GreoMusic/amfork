import { useState, useCallback } from 'react';
import { getReuest } from "../services/apiService";

export const useGroups = (token) => {
    const [groups, setGroups] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchGroups = useCallback(() => {
        setGroups([]);
        setIsProcessing(true);
        return getReuest('groups', token)
            .then(res => {
                setGroups(res.groups);
                setIsProcessing(false);
                return res.groups;
            })
            .catch(err => {
                setIsProcessing(false);
                throw err;
            });
    }, [token]);

    return {
        groups,
        isProcessing,
        fetchGroups
    };
};