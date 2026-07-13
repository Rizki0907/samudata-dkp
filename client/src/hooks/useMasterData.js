import { useState, useEffect } from 'react';
import api from '@/services/api';

export function useMasterData(category, fallbackOptions = []) {
  const [options, setOptions] = useState(fallbackOptions);

  useEffect(() => {
    if (!category) return;
    
    let isMounted = true;
    const fetchOptions = async () => {
      try {
        const res = await api.get(`/master-data/${category}`);
        if (res.data?.success && res.data?.data?.length > 0) {
          if (isMounted) {
            setOptions(res.data.data.map(item => item.value));
          }
        }
      } catch (err) {
        console.error(`Failed to fetch master data for ${category}:`, err);
      }
    };
    fetchOptions();
    
    return () => { isMounted = false; };
  }, [category]);

  return options;
}
