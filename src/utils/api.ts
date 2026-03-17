export const apiFetch = async (resource: RequestInfo | URL, config?: RequestInit) => {
  if (typeof resource === 'string' && resource.startsWith('/api/') && !resource.startsWith('/api/login') && !resource.startsWith('/api/superadmin')) {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (currentUser?.school_id) {
      config = config || {};
      config.headers = {
        ...config.headers,
        'x-school-id': currentUser.school_id.toString()
      };
    }
  }
  return fetch(resource, config);
};
