import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''

    req.on('data', (chunk) => {
      body += chunk
    })

    req.on('end', () => {
      if (!body.trim()) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(body))
      } catch (error) {
        reject(error)
      }
    })

    req.on('error', reject)
  })
}

function createApiResponse(res) {
  return {
    status(code) {
      res.statusCode = code
      return this
    },
    json(payload) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(payload))
    },
  }
}

function localApiPlugin() {
  return {
    name: 'local-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/generate-poem', async (req, res) => {
        try {
          const { default: handler } = await import('./api/generate-poem.js')
          req.body = await readJsonBody(req)
          await handler(req, createApiResponse(res))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Ошибка локального API.',
            }),
          )
        }
      })

      server.middlewares.use('/api/send-poem-email', async (req, res) => {
        try {
          const { default: handler } = await import('./api/send-poem-email.js')
          req.body = await readJsonBody(req)
          await handler(req, createApiResponse(res))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Ошибка локального API.',
            }),
          )
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    base: process.env.GITHUB_PAGES === 'true' ? '/Newswiteversion/' : '/',
    plugins: [react(), localApiPlugin()],
  }
})
