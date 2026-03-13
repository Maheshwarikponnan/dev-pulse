import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 6_000,
})

export async function fetchCurrentMetrics() {
  const response = await api.get('/metrics/current')
  return response.data.data
}

export async function fetchMetricsHistory(limit = 60) {
  const response = await api.get('/metrics/history', {
    params: { limit },
  })

  return response.data.data
}

export async function fetchServerStatus() {
  const response = await api.get('/status')
  return response.data.data
}

export { api }