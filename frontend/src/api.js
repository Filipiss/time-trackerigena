import { handleGuestRequest } from './utils/guestMock';

// Serviço de API — comunicação com o backend Flask com tradução de categorias
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ===================== AUTH HELPER =====================

function getToken() {
  return localStorage.getItem('auth_token');
}


/**
 * Helper para fazer requisições com tratamento de erro
 */
async function request(endpoint, options = {}, requiresAuth = true) {
  // Se a rota requer auth e não há token, intercepta para o Guest Mode (sessionStorage)
  if (requiresAuth && !getToken()) {
    return handleGuestRequest(endpoint, options);
  }

  const url = `${API_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (requiresAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { ...options, headers };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.detail || `HTTP Error: ${response.status}`);
    }

    if (response.status === 204) return null;

    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
    }
    throw error;
  }
}

// ===================== AUTH =====================

export async function apiRegister(username, email, password, phone) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, phone }),
  }, false);
}

export async function apiLogin(identifier, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  }, false);
}

export async function apiActivate(token) {
  return request(`/api/auth/activate?token=${token}`, {}, false);
}

export async function apiGetProfile(token) {
  return request('/api/auth/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }, false);
}

export async function updateSettings(data) {
  return request('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ==========================================
// Helpdesk Support API
// ==========================================

export async function createTicket(subject, message) {
  return request('/api/support', { method: 'POST', body: JSON.stringify({ subject, message }) });
}

export async function fetchMyTickets() {
  return request('/api/support', { method: 'GET' });
}

export async function fetchTicketMessages(ticketId) {
  return request(`/api/support/${ticketId}/messages`, { method: 'GET' });
}

export async function replyTicket(ticketId, message) {
  return request(`/api/support/${ticketId}/messages`, { method: 'POST', body: JSON.stringify({ message }) });
}

export async function fetchAllTicketsAdmin() {
  return request('/api/admin/support', { method: 'GET' });
}

export async function updateTicketStatusAdmin(ticketId, status) {
  return request(`/api/admin/support/${ticketId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
}

export async function apiUpdateProfile(data) {
  return request('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiChangePassword(currentPassword, newPassword) {
  return request('/api/users/change-password', {
    method: 'PUT',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
}

export async function apiForgotPassword(identifier) {
  return request('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
  }, false);
}

export async function apiResetPassword(token, newPassword) {
  return request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  }, false);
}

// ===================== CATEGORIES =====================

export const fetchCategories = () => request('/api/categories');
export const createCategory = (name) => request('/api/categories', { method: 'POST', body: JSON.stringify({ name }) });
export const updateCategory = (id, name) => request(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
export const deleteCategory = (id) => request(`/api/categories/${id}`, { method: 'DELETE' });
export const reorderCategories = (orderData) => request('/api/categories/reorder', { method: 'PATCH', body: JSON.stringify(orderData) });

// ===================== PROJECTS =====================

export async function fetchProjects(category = null) {
  const params = category ? `?category=${encodeURIComponent(category)}` : '';
  const data = await request(`/api/projects${params}`);

  return (data || []).map(project => ({
    ...project,
    category: project.category ? project.category.toLowerCase() : project.category
  }));
}

export async function createProject(data) {
  const response = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return {
    ...response,
    category: response.category ? response.category.toLowerCase() : response.category
  };
}

export async function updateProject(id, data) {
  const response = await request(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  return {
    ...response,
    category: response.category ? response.category.toLowerCase() : response.category
  };
}

export async function deleteProject(id) {
  return request(`/api/projects/${id}`, { method: 'DELETE' });
}

export async function reorderProjects(orderData) {
  return request('/api/projects/reorder', { method: 'PATCH', body: JSON.stringify(orderData) });
}

export async function fetchProjectDeadlineHistory(id) {
  return request(`/api/projects/${id}/deadline-history`);
}

export async function fetchProjectAttachments(id) {
  return request(`/api/projects/${id}/attachments`);
}

export async function addProjectAttachment(id, data) {
  return request(`/api/projects/${id}/attachments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteProjectAttachment(attachmentId) {
  return request(`/api/projects/attachments/${attachmentId}`, { method: 'DELETE' });
}

export async function updateProjectAttachment(projectId, attachmentId, data) {
  return request(`/api/projects/${projectId}/attachments/${attachmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ===================== TASKS =====================

export async function fetchTasks(category = null) {
  const params = category ? `?category=${encodeURIComponent(category)}` : '';
  const data = await request(`/api/tasks${params}`);

  return (data || []).map(task => ({
    ...task,
    category: task.category ? task.category.toLowerCase() : task.category
  }));
}

export async function createTask(data) {
  const response = await request('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return {
    ...response,
    category: response.category ? response.category.toLowerCase() : response.category
  };
}

export async function updateTask(id, data) {
  const response = await request(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  return {
    ...response,
    category: response.category ? response.category.toLowerCase() : response.category
  };
}

export async function deleteTask(id) {
  return request(`/api/tasks/${id}`, { method: 'DELETE' });
}

export async function reorderTasks(orderData) {
  return request('/api/tasks/reorder', { method: 'PATCH', body: JSON.stringify(orderData) });
}

/* =========================================================================
   CALENDAR EVENTS ENDPOINTS
   ========================================================================= */

export const getCalendarEvents = async () => {
  return request('/api/calendar_events');
};

export const createCalendarEvent = async (eventData) => {
  return request('/api/calendar_events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
};

export const updateCalendarEvent = async (eventId, eventData) => {
  return request(`/api/calendar_events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  });
};

export const deleteCalendarEvent = async (eventId) => {
  return request(`/api/calendar_events/${eventId}`, {
    method: 'DELETE',
  });
};

export async function fetchTaskDeadlineHistory(id) {
  return request(`/api/tasks/${id}/deadline-history`);
}

// ===================== TIME ENTRIES =====================

export async function fetchTimeEntries(filters = {}) {
  const params = new URLSearchParams();

  if (filters.category) {
    params.append('category', filters.category);
  }
  if (filters.task_id) params.append('task_id', filters.task_id);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);

  const queryString = params.toString();
  const endpoint = queryString ? `/api/time-entries?${queryString}` : '/api/time-entries';

  const data = await request(endpoint);

  return (data || []).map(entry => ({
    ...entry,
    task_category: entry.task_category ? entry.task_category.toLowerCase() : entry.task_category
  }));
}

export async function createTimeEntry(data) {
  const now = new Date();
  const durationSeconds = data.duration_seconds || 0;
  const startTime = data.start_time || new Date(now.getTime() - durationSeconds * 1000).toISOString();
  const endTime = data.end_time || now.toISOString();

  const payload = {
    task_id: data.task_id,
    start_time: startTime,
    end_time: endTime,
    duration_seconds: durationSeconds,
    notes: data.notes || null,
  };

  const response = await request('/api/time-entries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    ...response,
    task_category: response.task_category ? response.task_category.toLowerCase() : response.task_category
  };
}

export async function deleteTimeEntry(id) {
  return request(`/api/time-entries/${id}`, { method: 'DELETE' });
}

export async function updateTimeEntry(id, data) {
  const response = await request(`/api/time-entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return {
    ...response,
    task_category: response.task_category ? response.task_category.toLowerCase() : response.task_category
  };
}

// ===================== STATS =====================

export async function fetchStats(filters = {}) {
  const params = new URLSearchParams(filters);
  const stats = await request(`/api/time-entries/stats?${params}`);

  return {
    ...stats,
    time_by_category: (stats.time_by_category || []).map(c => ({
      ...c,
      category: c.category ? c.category.toLowerCase() : c.category
    })),
    time_by_task: (stats.time_by_task || []).map(t => ({
      ...t,
      category: t.category ? t.category.toLowerCase() : t.category
    })),
    time_by_day: stats.time_by_day || []
  };
}

// ===================== ADMIN =====================

export async function fetchAdminMetrics() {
  return request('/api/admin/metrics');
}

export async function fetchAllUsers() {
  return request('/api/admin/users');
}

export async function createAdminUser(data) {
  return request('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function toggleAdminRole(userId, isAdmin) {
  return request(`/api/admin/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ is_admin: isAdmin }),
  });
}

export async function deleteAdminUser(userId) {
  return request(`/api/admin/users/${userId}`, { method: 'DELETE' });
}

export async function deleteTicketAdmin(ticketId) {
  return request(`/api/admin/support/${ticketId}`, { method: 'DELETE' });
}

export async function updateUserProfile(userId, profileData) {
  return request(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
}

export async function fetchSettings() {
  // Public route, but requiresAuth=false so it doesn't bounce to Guest mock
  // Added a cache breaker to ensure polling ignores 304 Not Modified browser caching
  return request(`/api/settings?t=${Date.now()}`, {}, false);
}

export async function fetchAuditLogs(filters = {}) {
  const query = new URLSearchParams();
  if (filters.action) query.set('action', filters.action);
  if (filters.username) query.set('username', filters.username);
  if (filters.limit) query.set('limit', filters.limit);
  return request(`/api/admin/logs?${query.toString()}`);
}

export async function deleteAuditLog(logId) {
  return request(`/api/admin/logs/${logId}`, { method: 'DELETE' });
}

export async function deleteAuditLogsBulk(logIds) {
  return request('/api/admin/logs/delete-bulk', {
    method: 'POST',
    body: JSON.stringify({ log_ids: logIds }),
  });
}

export async function clearAllAuditLogs() {
  return request('/api/admin/logs/clear', { method: 'DELETE' });
}
