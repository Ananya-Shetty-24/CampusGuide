import { useState, useEffect, useRef } from 'react';

const API_BASE_URL = 'http://localhost:3001/api';

export function useStatusStream(resourceId) {
  const [status, setStatus] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!resourceId) return;

    let reconnectTimeout = null;
    let eventSource = null;

    function connect() {
      eventSource = new EventSource(
        `${API_BASE_URL}/resources/${resourceId}/status/stream`
      );
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'RESOURCE_STATUS_CHANGED') {
            setStatus({
              live_status: data.status,
              updated_at: data.updated_at
            });
          }
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
        reconnectTimeout = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
    };
  }, [resourceId]);

  return { status, isConnected };
}
