import { useState, useEffect } from 'react';
import { useSupabase } from '@/components/supabase-provider';

interface CityUpdateInfo {
  city: string;
  last_update_date: string;
}

export function useCityLastUpdates() {
  const { supabase } = useSupabase();
  const [data, setData] = useState<CityUpdateInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const { data: updates, error } = await supabase
          .rpc('get_city_last_updates');
        
        if (error) {
          console.error('Error fetching city updates:', error);
          return;
        }

        if (updates) {
          setData(updates as CityUpdateInfo[]);
        }
      } catch (err) {
        console.error('Unexpected error fetching updates:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUpdates();
  }, [supabase]);

  return { data, loading };
}
