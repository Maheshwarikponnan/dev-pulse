import mongoose from 'mongoose'

const connectionStates = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
}

// Database connectivity is optional during local development, so the app can
// still stream live metrics when MongoDB has not been started yet.
export async function connectToDatabase({ onStateChange } = {}) {
  const mongoUri = process.env.MONGODB_URI

  if (!mongoUri) {
    console.warn(
      '[db] MONGODB_URI is not set. Historical persistence is disabled.',
    )
    onStateChange?.(false, getDatabaseStatus())
    return false
  }

  mongoose.connection.on('connected', () => {
    onStateChange?.(true, getDatabaseStatus())
  })

  mongoose.connection.on('disconnected', () => {
    onStateChange?.(false, getDatabaseStatus())
  })

  mongoose.connection.on('error', (error) => {
    console.error(`[db] MongoDB error: ${error.message}`)
    onStateChange?.(false, 'error')
  })

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    })

    return true
  } catch (error) {
    console.error(`[db] Unable to connect to MongoDB: ${error.message}`)
    onStateChange?.(false, 'error')
    return false
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close()
  }
}

export function getDatabaseStatus() {
  return connectionStates[mongoose.connection.readyState] ?? 'error'
}