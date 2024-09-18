import { useEffect, useState } from 'react';
import { API_NAMESPACE, IpcLoggerApi, LogData } from '../../shared';

export function useRenderer() {
  const [isReady, setIsReady] = useState(false);
  const [logData, setLogData] = useState<LogData[]>([]);

  useEffect(() => {
    const check = () => {
      const ready = api() !== undefined;
      if (ready) {
        setIsReady(true);
      } else {
        setTimeout(check, 500);
      }
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const listener = (data: ReadonlyArray<LogData>): void => {
      setLogData([...data]);
    };
    api().onUpdate(listener);
  }, [isReady]);

  return {
    // startTime: api().startTime,
    isReady,
    logData,
  };
}

function api(): IpcLoggerApi {
  // can't access the window directly, so need to use an injected script to run
  // inside the window, plus window.postMessage
  // https://developer.chrome.com/docs/extensions/how-to/devtools/extend-devtools#evaluated-scripts-to-devtools

  return chrome.extension.getBackgroundPage().window?.[
    API_NAMESPACE
  ] as IpcLoggerApi;
}
