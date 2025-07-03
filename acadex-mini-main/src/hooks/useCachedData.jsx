import { useState, useEffect } from 'react';
import { getReuest } from '../services/apiService';

const useCachedData = (url_segment, token) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(null);

  const fetchData = async (url) => {
    setIsLoading(true);
    try {

      getReuest(url, token).then(fetchedData => {
        setData(fetchedData);
        localStorage.setItem(
          `cachedData-${url}`,
          JSON.stringify({ data: fetchedData, expirationTime: Date.now() + (60 * 60 * 1000) })
        );
      }).catch(error => {
        throw new Error(`Error fetching data: ${error}`);
      });

    } catch (error) {
      setIsError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check localStorage and handle expiration on mount
  useEffect(() => {
    const cachedData = localStorage.getItem(`cachedData-${url_segment}`);
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      if (parsedData.expirationTime > Date.now()) {
        setData(parsedData.data);
        return;
      }
      // Cached data expired, remove it
      localStorage.removeItem(`cachedData-${url_segment}`);
    }
    // const baseUrl = `${apiUrl}/${url_segment}`; // Assuming apiUrl is a constant
    fetchData(url_segment); // Fetch data if not cached or expired
  }, [token]); // Re-fetch on token change

  return { data, isLoading, isError, refetchData: () => fetchData(url_segment) };
};

export default useCachedData;
