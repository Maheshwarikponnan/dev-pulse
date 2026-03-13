import { io } from 'socket.io-client'

let metricsSocket

export function getMetricsSocket() {
  if (!metricsSocket) {
    metricsSocket = io(import.meta.env.VITE_SOCKET_URL, {
      path: import.meta.env.VITE_SOCKET_PATH || '/socket.io',
      transports: ['websocket', 'polling'],
    })
  }

  return metricsSocket
}

export function closeMetricsSocket() {
  if (metricsSocket) {
    metricsSocket.disconnect()
    metricsSocket = null
  }
}