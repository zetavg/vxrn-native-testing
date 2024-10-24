import { spawn } from 'child_process'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')

const PID_FILE = path.join(PROJECT_ROOT, 'dev-server.pid')
const LOG_FILE = path.join(PROJECT_ROOT, 'dev-server.log')

const SERVER_PORT = 8081

// Function to check if the server is running
function checkServer() {
  return new Promise((resolve, reject) => {
    const options = {
      host: 'localhost',
      port: SERVER_PORT,
    }
    const req = http.get(options, (res) => {
      resolve(res.statusCode === 200) // Server is up if status is 200
    })
    req.on('error', () => {
      reject(false) // Server is not up
    })
  })
}

// Function to wait for the server to be up
async function waitForServer() {
  const maxRetries = 100
  const delay = 1000 // 1 second
  let retries = 0

  while (retries < maxRetries) {
    try {
      const isUp = await checkServer()
      if (isUp) {
        console.info('Server is up!')
        return
      }
    } catch {
      // Ignore errors and retry
    }
    console.info(`Waiting for server... (${retries + 1}/${maxRetries})`)
    await new Promise((resolve) => setTimeout(resolve, delay))
    retries++
  }

  let lastFewLinesOfServerLog = ''
  try {
    lastFewLinesOfServerLog = fs.readFileSync(LOG_FILE, 'utf8').split('\n').slice(-10).join('\n')
  } catch {}

  throw new Error(
    `Server did not start within the expected time.${lastFewLinesOfServerLog ? `\nLast few lines of server log:\n--------\n${lastFewLinesOfServerLog}\n--------\n` : ''}`
  )
}

// Function to kill any existing server using the PID from the file
function killExistingServer() {
  if (fs.existsSync(PID_FILE)) {
    const pid = fs.readFileSync(PID_FILE, 'utf8')
    try {
      process.kill(pid, 'SIGTERM')
      console.info(`Killed existing server with PID: ${pid}`)
    } catch (error) {
      console.error(`Failed to kill process with PID: ${pid}`, error)
    }
    fs.unlinkSync(PID_FILE) // Remove the PID file
  }
}

// Function to start a new server
function startNewServer() {
  const out = fs.openSync(LOG_FILE, 'a' /* append mode */)
  const err = fs.openSync(LOG_FILE, 'a' /* append mode */)

  const child = spawn(
    // Not using `yarn dev` here since if we use `yarn dev` we will get a PID that is not the actual server's PID
    path.join(PROJECT_ROOT, 'node_modules', '.bin', 'one'),
    ['dev', '--port', SERVER_PORT],
    {
      stdio: ['ignore', out, err], // Redirect output to server.log
      detached: true, // Detaches the process from the parent
    }
  )
  fs.writeFileSync(PID_FILE, String(child.pid))
  console.info(`Started new server with PID: ${child.pid}`)
  child.unref() // Allows the parent process to exit independently of the child
}

async function main() {
  try {
    // Kill any existing server
    killExistingServer()

    // Start a new server
    startNewServer()

    // Wait for the server to be up
    await waitForServer()

    console.info('Server listening on port', SERVER_PORT)
    console.info('Exiting script while the server keeps running.')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
