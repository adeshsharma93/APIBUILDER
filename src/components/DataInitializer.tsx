import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { connectionsApi, apisApi, apiKeysApi, logsApi, queriesApi } from '../services/api';

export const DataInitializer: React.FC = () => {
  const { 
    setConnections, 
    setApis, 
    setApiKeys, 
    setRequestLogs, 
    setQueries,
    connections 
  } = useStore();

  useEffect(() => {
    const initializeData = async () => {
      // Only fetch from backend if we have real connections (not just demo)
      const hasRealConnections = connections.some(c => c.id !== 'conn-demo');
      
      if (hasRealConnections) {
        // Fetch real data from backend
        const [connectionsData, apisData, apiKeysData, logsData, queriesData] = await Promise.all([
          connectionsApi.getAll(),
          apisApi.getAll(),
          apiKeysApi.getAll(),
          logsApi.getAll(),
          queriesApi.getAll(),
        ]);

        if (connectionsData.length > 0) setConnections(connectionsData);
        if (apisData.length > 0) setApis(apisData);
        if (apiKeysData.length > 0) setApiKeys(apiKeysData);
        if (logsData.length > 0) setRequestLogs(logsData);
        if (queriesData.length > 0) setQueries(queriesData);
      }
    };

    initializeData();
  }, []);

  return null; // This component doesn't render anything
};
