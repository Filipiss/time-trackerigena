// Mock database utilizando sessionStorage para o Modo Visitante (Guest)
// Todos os dados são apagados automaticamente ao fechar o navegador.

const GUEST_G = 'guest_categories';
const GUEST_P = 'guest_projects';
const GUEST_T = 'guest_tasks';
const GUEST_E = 'guest_entries';

// Inicialização sezia se não existir
function getStore(key) {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function setStore(key, arr) {
    sessionStorage.setItem(key, JSON.stringify(arr));
}

// Helpers para simular ID (Timestamp simples)
const generateId = () => Date.now();

const MockDB = {
    // Categorias
    getCategories: () => getStore(GUEST_G),
    createCategory: (name) => {
        const categories = getStore(GUEST_G);
        const newCat = { id: generateId(), name };
        categories.push(newCat);
        setStore(GUEST_G, categories);
        return newCat;
    },
    updateCategory: (id, name) => {
        const categories = getStore(GUEST_G);
        const index = categories.findIndex(c => String(c.id) === String(id));
        if (index === -1) throw new Error('Not found');
        categories[index].name = name;
        setStore(GUEST_G, categories);
        return categories[index];
    },
    deleteCategory: (id) => {
        const categories = getStore(GUEST_G);
        const catToDelete = categories.find(c => String(c.id) === String(id));
        setStore(GUEST_G, categories.filter(c => String(c.id) !== String(id)));

        if (catToDelete) {
            // Cascade delete empty projects (wait, project has category name?)
            // As API works with category names as filters:
            const projects = getStore(GUEST_P);
            const projsToDelete = projects.filter(p => !p.category || p.category.toLowerCase() === catToDelete.name.toLowerCase());

            // Delete those projects
            projsToDelete.forEach(p => MockDB.deleteProject(p.id));
        }
        return null;
    },

    // Projetos
    getProjects: (catFilter) => {
        let projects = getStore(GUEST_P);
        if (catFilter) {
            projects = projects.filter(p => (p.category || '').toLowerCase() === catFilter.toLowerCase());
        }
        return projects;
    },
    createProject: (data) => {
        const projects = getStore(GUEST_P);
        const newProj = { id: generateId(), ...data };
        projects.push(newProj);
        setStore(GUEST_P, projects);
        return newProj;
    },
    updateProject: (id, data) => {
        const projects = getStore(GUEST_P);
        const index = projects.findIndex(p => String(p.id) === String(id));
        if (index === -1) throw new Error('Not found');
        projects[index] = { ...projects[index], ...data };
        setStore(GUEST_P, projects);
        return projects[index];
    },
    deleteProject: (id) => {
        const projects = getStore(GUEST_P);
        setStore(GUEST_P, projects.filter(p => String(p.id) !== String(id)));

        // Cascade delete tasks
        const tasks = getStore(GUEST_T);
        const tasksToDelete = tasks.filter(t => String(t.project_id) === String(id));
        tasksToDelete.forEach(t => MockDB.deleteTask(t.id));

        return null;
    },
    getProjectDeadlineHistory: (id) => [],

    // Tasks
    getTasks: (catFilter) => {
        let tasks = getStore(GUEST_T);
        if (catFilter) {
            tasks = tasks.filter(t => (t.category || '').toLowerCase() === catFilter.toLowerCase());
        }
        const projects = getStore(GUEST_P);
        return tasks.map(t => {
            const p = projects.find(proj => String(proj.id) === String(t.project_id));
            return { ...t, project_name: p ? p.name : 'Unknown' };
        });
    },
    createTask: (data) => {
        const tasks = getStore(GUEST_T);
        const newTask = { id: generateId(), status: 'todo', ...data };
        tasks.push(newTask);
        setStore(GUEST_T, tasks);
        return newTask;
    },
    updateTask: (id, data) => {
        const tasks = getStore(GUEST_T);
        const index = tasks.findIndex(t => String(t.id) === String(id));
        if (index === -1) throw new Error('Not found');
        tasks[index] = { ...tasks[index], ...data };
        setStore(GUEST_T, tasks);
        return tasks[index];
    },
    deleteTask: (id) => {
        const tasks = getStore(GUEST_T);
        setStore(GUEST_T, tasks.filter(t => String(t.id) !== String(id)));

        // Cascade delete time entries
        const entries = getStore(GUEST_E);
        setStore(GUEST_E, entries.filter(e => String(e.task_id) !== String(id)));

        return null;
    },

    // Time Entries
    getTimeEntries: (params) => {
        let entries = getStore(GUEST_E);
        // Simple filter by task_id and dates if requested
        if (params.has('task_id')) {
            entries = entries.filter(e => String(e.task_id) === String(params.get('task_id')));
        }
        if (params.has('start_date') && params.has('end_date')) {
            const startTimestamp = new Date(params.get('start_date')).getTime();
            const endTimestamp = new Date(params.get('end_date')).getTime();
            entries = entries.filter(e => {
                const entryTime = new Date(e.start_time).getTime();
                return entryTime >= startTimestamp && entryTime <= endTimestamp;
            });
        }

        const tasks = getStore(GUEST_T);
        const projects = getStore(GUEST_P);

        // Decorate with task details
        entries = entries.map(e => {
            const t = tasks.find(tsk => String(tsk.id) === String(e.task_id));
            let task_name = 'Unknown', task_category = '', project_name = '';
            if (t) {
                task_name = t.name;
                task_category = t.category;
                const p = projects.find(proj => String(proj.id) === String(t.project_id));
                if (p) project_name = p.name;
            }
            return { ...e, task_name, task_category, project_name };
        });

        // sort descending by start_time
        entries.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
        return entries;
    },
    createTimeEntry: (data) => {
        const entries = getStore(GUEST_E);
        const newEntry = { id: generateId(), ...data };
        entries.push(newEntry);
        setStore(GUEST_E, entries);

        const tasks = getStore(GUEST_T);
        const t = tasks.find(tsk => String(tsk.id) === String(data.task_id));
        return { ...newEntry, task_category: t ? t.category : '' };
    },
    deleteTimeEntry: (id) => {
        const entries = getStore(GUEST_E);
        setStore(GUEST_E, entries.filter(e => String(e.id) !== String(id)));
        return null;
    },

    // Stats
    getStats: (params) => {
        const entries = MockDB.getTimeEntries(params);
        let totalTime = 0;
        const catMap = {};
        const taskMap = {};

        entries.forEach(e => {
            totalTime += e.duration_seconds;
            const cat = e.task_category || 'Uncategorized';
            catMap[cat] = (catMap[cat] || 0) + e.duration_seconds;

            if (e.task_name) {
                if (!taskMap[e.task_name]) taskMap[e.task_name] = { category: cat, duration: 0 };
                taskMap[e.task_name].duration += e.duration_seconds;
            }
        });

        const time_by_category = Object.entries(catMap).map(([category, duration_seconds]) => ({ category, duration_seconds }));
        const time_by_task = Object.entries(taskMap).map(([task_name, val]) => ({ task_name, category: val.category, duration_seconds: val.duration }));
        const time_by_day = []; // Optional simplification for guest mode

        return { total_time: totalTime, time_by_category, time_by_task, time_by_day };
    }
};

export async function handleGuestRequest(endpoint, options = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : null;

    // Simulate network delay for realism
    await new Promise(r => setTimeout(r, 200));

    try {
        const [pathAndQuery] = endpoint.split('?');
        const [path, queryString] = endpoint.split('?');
        const params = new URLSearchParams(queryString || '');
        const parts = path.split('/').filter(Boolean); // ['api', 'tasks', '123']

        if (parts[1] === 'auth' && parts[2] === 'me') {
            // Se for getProfile no load (não deve acontecer mas pro caso)
            return null; // Guest não tem profile info autenticado
        }

        if (parts[1] === 'categories') {
            if (method === 'GET') return MockDB.getCategories();
            if (method === 'POST') return MockDB.createCategory(body.name);
            if (method === 'PUT') return MockDB.updateCategory(parts[2], body.name);
            if (method === 'DELETE') return MockDB.deleteCategory(parts[2]);
        }

        if (parts[1] === 'projects') {
            if (method === 'GET' && parts[3] === 'deadline-history') return MockDB.getProjectDeadlineHistory(parts[2]);
            if (method === 'GET') return MockDB.getProjects(params.get('category'));
            if (method === 'POST') return MockDB.createProject(body);
            if (method === 'PUT') return MockDB.updateProject(parts[2], body);
            if (method === 'DELETE') return MockDB.deleteProject(parts[2]);
        }

        if (parts[1] === 'tasks') {
            if (method === 'GET') return MockDB.getTasks(params.get('category'));
            if (method === 'POST') return MockDB.createTask(body);
            if (method === 'PUT') return MockDB.updateTask(parts[2], body);
            if (method === 'DELETE') return MockDB.deleteTask(parts[2]);
        }

        if (parts[1] === 'time-entries') {
            if (parts[2] === 'stats') return MockDB.getStats(params);
            if (method === 'GET') return MockDB.getTimeEntries(params);
            if (method === 'POST') return MockDB.createTimeEntry(body);
            if (method === 'DELETE') return MockDB.deleteTimeEntry(parts[2]);
        }

    } catch (e) {
        throw new Error('Guest API Error: ' + e.message);
    }

    throw new Error('Guest Mock Endpoint não suportado: ' + endpoint);
}
