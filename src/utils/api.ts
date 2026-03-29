export const apiFetch = async (resource: RequestInfo | URL, config?: RequestInit) => {
  if (typeof resource === 'string' && resource.startsWith('/api/') && !resource.startsWith('/api/login') && !resource.startsWith('/api/superadmin')) {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    const schoolId = currentUser?.school_id || currentUser?.schoolId;
    const userId = currentUser?.id;
    
    config = config || {};
    config.headers = {
      ...config.headers,
    };
    
    if (schoolId) {
      (config.headers as Record<string, string>)['x-school-id'] = schoolId.toString();
    }
    if (userId) {
      (config.headers as Record<string, string>)['x-user-id'] = userId.toString();
    }
  }
  return fetch(resource, config);
};
