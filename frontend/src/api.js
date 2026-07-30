// Serviço de API — comunicação com o backend FastAPI com tradução de categorias
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Helper para fazer requisições com tratamento de erro
 */
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP Error: ${response.status}`);
    }

    // Retorna null para 204 No Content
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
    }
    throw error;
  }
}

// ===================== PROJECTS =====================

/**
 * Buscar todos os projetos, opcionalmente filtrados por categoria
 */
export async function fetchProjects(category = null) {
  let paramCategory = category;
  if (category === 'loco') paramCategory = 'Loco';
  if (category === 'freelas') paramCategory = 'Freelas';

  const params = paramCategory ? `?category=${encodeURIComponent(paramCategory)}` : '';
  const data = await request(`/api/projects${params}`);

  return (data || []).map(project => ({
    ...project,
    category: project.category ? project.category.toLowerCase() : project.category
  }));
}

/**
 * Criar um novo projeto
 */
export async function createProject(data) {
  const payload = {
    ...data,
    category: data.category === 'loco' ? 'Loco' : (data.category === 'freelas' ? 'Freelas' : data.category)
  };

  const response = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    ...response,
    category: response.category ? response.category.toLowerCase() : response.category
  };
}

/**
 * Atualizar um projeto existente
 */
export async function updateProject(id, data) {
  const payload = { ...data };
  if (data.category) {
    payload.category = data.category === 'loco' ? 'Loco' : (data.category === 'freelas' ? 'Freelas' : data.category);
  }

  const response = await request(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return {
    ...response,
    category: response.category ? response.category.toLowerCase() : response.category
  };
}

/**
 * Deletar um projeto
 */
export async function deleteProject(id) {
  return request(`/api/projects/${id}`, {
    method: 'DELETE',
  });
}

// ===================== TASKS =====================

/**
 * Buscar todas as tasks, opcionalmente filtradas por categoria
 */
export async function fetchTasks(category = null) {
  let paramCategory = category;
  if (category === 'loco') paramCategory = 'Loco';
  if (category === 'freelas') paramCategory = 'Freelas';

  const params = paramCategory ? `?category=${encodeURIComponent(paramCategory)}` : '';
  const data = await request(`/api/tasks${params}`);

  return (data || []).map(task => ({
    ...task,
    category: task.category ? task.category.toLowerCase() : task.category
  }));
}

/**
 * Criar uma nova task
 */
export async function createTask(data) {
  const payload = {
    ...data,
    category: data.category === 'loco' ? 'Loco' : (data.category === 'freelas' ? 'Freelas' : data.category)
  };

  const response = await request('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    ...response,
    category: response.category ? response.category.toLowerCase() : response.category
  };
}

/**
 * Atualizar uma task existente
 */
export async function updateTask(id, data) {
  const payload = { ...data };
  if (data.category) {
    payload.category = data.category === 'loco' ? 'Loco' : (data.category === 'freelas' ? 'Freelas' : data.category);
  }

  const response = await request(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return {
    ...response,
    category: response.category ? response.category.toLowerCase() : response.category
  };
}

/**
 * Deletar uma task
 */
export async function deleteTask(id) {
  return request(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
}

// ===================== TIME ENTRIES =====================

/**
 * Buscar time entries com filtros opcionais
 */
export async function fetchTimeEntries(filters = {}) {
  const params = new URLSearchParams();

  if (filters.category) {
    const backendCat = filters.category === 'loco' ? 'Loco' : (filters.category === 'freelas' ? 'Freelas' : filters.category);
    params.append('category', backendCat);
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

/**
 * Criar um novo time entry
 */
export async function createTimeEntry(data) {
  // start_time e end_time precisam ser enviados
  // se o frontend não mandar start_time, usamos o horário atual - duração
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

/**
 * Deletar um time entry
 */
export async function deleteTimeEntry(id) {
  return request(`/api/time-entries/${id}`, {
    method: 'DELETE',
  });
}

// ===================== STATS =====================

/**
 * Buscar estatísticas para o dashboard
 */
export async function fetchStats() {
  const stats = await request('/api/time-entries/stats');
  
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
