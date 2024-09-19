import { useEffect, useState } from 'react';
import { API_NAMESPACE, IpcLoggerApi, IpcLogData } from '../../shared';

const api = window[API_NAMESPACE] as IpcLoggerApi;

export function useRenderer() {
  const [logData, setLogData] = useState<IpcLogData[]>([]);

  useEffect(() => {
    const listener = (data: ReadonlyArray<IpcLogData>): void => {
      setLogData([...data]);
    };
    api.onUpdate(listener);
  }, []);

  return {
    startTime: api.startTime,
    isReady: true,
    logData,
  };
}
