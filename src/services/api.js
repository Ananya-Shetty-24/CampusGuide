const API_BASE_URL = 'http://localhost:3001/api';

export async function searchCampus(query, type = 'all', limit = 10) {
  const params = new URLSearchParams({
    q: query,
    type,
    limit: limit.toString()
  });
  
  const response = await fetch(`${API_BASE_URL}/search?${params}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Search failed');
  }
  
  return response.json();
}

export async function getSearchSuggestions(query, limit = 8) {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString()
  });
  
  const response = await fetch(`${API_BASE_URL}/search/suggestions?${params}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Suggestions failed');
  }
  
  return response.json();
}

export async function getResourceById(resourceId) {
  const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Resource not found');
  }
  
  return response.json();
}

export async function getResourceStatus(resourceId) {
  const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/status`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Status unavailable');
  }
  
  return response.json();
}

export async function getResourceAvailability(resourceId, date) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  
  const url = `${API_BASE_URL}/resources/${resourceId}/availability` + 
    (params.toString() ? `?${params}` : '');
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Availability unavailable');
  }
  
  return response.json();
}

export async function createBooking(resourceId, availabilityId) {
  const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ availability_id: availabilityId })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Booking failed');
  }

  return data;
}

export function connectStatusStream(resourceId, onStatusChange) {
  const eventSource = new EventSource(
    `${API_BASE_URL}/resources/${resourceId}/status/stream`
  );
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'RESOURCE_STATUS_CHANGED') {
        onStatusChange(data);
      }
    } catch (e) {
      console.error('SSE parse error:', e);
    }
  };
  
  eventSource.onerror = () => {
    eventSource.close();
  };
  
  return () => eventSource.close();
}
