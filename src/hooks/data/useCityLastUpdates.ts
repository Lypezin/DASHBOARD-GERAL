import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeLog } from '@/lib/errorHandler';

interface CityUpdateInfo {
  city: string;
  last_update_date: string;
}

export function useCityLastUpdates() {
  const [data, setData] = useState<CityUpdateInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const { data: updates, error } = await supabase
          .rpc('get_city_last_updates');

        if (error) {
          safeLog.error('Error fetching city updates:', error);
          return;
        }

        if (updates) {
          setData(updates as CityUpdateInfo[]);
        }
      } catch (err) {
        safeLog.error('Unexpected error fetching updates:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUpdates();
  }, []);

  return { data, loading };
}
