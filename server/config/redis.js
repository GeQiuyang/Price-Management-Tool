import { createClient } from 'redis'
import dotenv from 'dotenv'

dotenv.config()

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  password: process.env.REDIS_PASSWORD || undefined,
})

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err)
})

redisClient.on('connect', () => {
  console.log('Redis Client Connected')
})

redisClient.on('ready', () => {
  console.log('Redis Client Ready')
})

redisClient.on('end', () => {
  console.log('Redis Client Disconnected')
})

export async function connectRedis() {
  try {
    await redisClient.connect()
    return redisClient
  } catch (error) {
    console.error('Failed to connect to Redis:', error)
    throw error
  }
}

export async function disconnectRedis() {
  try {
    await redisClient.quit()
  } catch (error) {
    console.error('Failed to disconnect Redis:', error)
  }
}

export default redisClient
