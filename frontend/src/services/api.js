import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Validate that an id is a safe positive integer before use in URL paths
const safeId = (id) => {
  const n = parseInt(id, 10)
  if (!Number.isInteger(n) || n <= 0) throw new Error(`Invalid resource id: ${id}`)
  return n
}
// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

// Patients
export const patientsAPI = {
  list: (params) => api.get('/patients', { params }),
  get: (id) => api.get(`/patients/${safeId(id)}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${safeId(id)}`, data),
  delete: (id) => api.delete(`/patients/${safeId(id)}`),
}

// Doctors
export const doctorsAPI = {
  list: (params) => api.get('/doctors', { params }),
  get: (id) => api.get(`/doctors/${safeId(id)}`),
  create: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${safeId(id)}`, data),
  delete: (id) => api.delete(`/doctors/${safeId(id)}`),
  listDepartments: () => api.get('/doctors/departments'),
  createDepartment: (data) => api.post('/doctors/departments', data),
}

// Appointments
export const appointmentsAPI = {
  list: (params) => api.get('/appointments', { params }),
  get: (id) => api.get(`/appointments/${safeId(id)}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${safeId(id)}`, data),
  cancel: (id) => api.delete(`/appointments/${safeId(id)}`),
  today: (params) => api.get('/appointments/today', { params }),
}

// Stats
export const statsAPI = {
  get: () => api.get('/stats'),
}

export default api
