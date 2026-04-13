const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const { fork } = require('child_process')

const PORT = 3001
let serverProcess = null
let mainWindow = null

function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, '..', 'server', 'server.js')

    const appRoot = path.join(__dirname, '..')

    // fork server.js as a child process
    serverProcess = fork(serverPath, [], {
      env: { ...process.env, PORT: String(PORT), ELECTRON: '1', APP_ROOT: appRoot },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    })

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString()
      console.log('[Server]', msg)
      // server.js prints this when ready
      if (msg.includes('Server running on')) {
        resolve()
      }
    })

    serverProcess.stderr.on('data', (data) => {
      console.error('[Server Error]', data.toString())
    })

    serverProcess.on('message', (msg) => {
      if (msg === 'server-ready') {
        resolve()
      }
    })

    serverProcess.on('error', (err) => {
      console.error('Failed to start server:', err)
      reject(err)
    })

    serverProcess.on('exit', (code) => {
      console.log(`Server process exited with code ${code}`)
      serverProcess = null
    })

    // Timeout fallback - resolve after 5s even if no signal received
    setTimeout(() => resolve(), 5000)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'QuoteFlow 报价管理工具',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  mainWindow.loadURL(`http://localhost:${PORT}`)

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function killServer() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM')
    // Force kill after 3s if still alive
    setTimeout(() => {
      if (serverProcess) {
        serverProcess.kill('SIGKILL')
      }
    }, 3000)
    serverProcess = null
  }
}

app.whenReady().then(async () => {
  try {
    await startServer()
  } catch (err) {
    console.error('Server start failed:', err)
  }
  createWindow()
})

app.on('window-all-closed', () => {
  killServer()
  app.quit()
})

app.on('before-quit', () => {
  killServer()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
