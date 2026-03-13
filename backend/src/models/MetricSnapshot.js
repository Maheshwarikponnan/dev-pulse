import mongoose from 'mongoose'

const alertSchema = new mongoose.Schema(
  {
    type: String,
    severity: String,
    message: String,
  },
  { _id: false },
)

const nodeSchema = new mongoose.Schema(
  {
    name: String,
    cpuUsage: Number,
    memoryUsage: Number,
    requestLatencyMs: Number,
    requestRate: Number,
    errorRate: Number,
    status: String,
  },
  { _id: false },
)

// Each document captures a full metric snapshot so the dashboard can render
// both current values and historical charts from the same shape.
const metricSnapshotSchema = new mongoose.Schema(
  {
    capturedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    host: {
      hostname: String,
      platform: String,
      nodeVersion: String,
    },
    system: {
      cpuUsage: Number,
      memoryUsage: Number,
      uptimeSeconds: Number,
      totalMemoryMb: Number,
      freeMemoryMb: Number,
      cpuCount: Number,
      loadAverage: [Number],
    },
    process: {
      pid: Number,
      uptimeSeconds: Number,
      rssMb: Number,
      heapUsedMb: Number,
      heapTotalMb: Number,
      externalMb: Number,
    },
    application: {
      requestLatencyMs: Number,
      requestRate: Number,
      errorRate: Number,
      totalRequests: Number,
      totalErrors: Number,
    },
    infrastructure: {
      databaseConnected: Boolean,
      databaseStatus: String,
      socketClients: Number,
    },
    nodes: [nodeSchema],
    alerts: [alertSchema],
  },
  {
    versionKey: false,
  },
)

export default mongoose.models.MetricSnapshot ||
  mongoose.model('MetricSnapshot', metricSnapshotSchema)