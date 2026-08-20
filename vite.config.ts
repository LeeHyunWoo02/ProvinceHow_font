/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'

const DEFAULT_API_PROXY_TARGET = 'https://api.jibang.info'

// https://vitejs.dev/config https://vitest.dev/config
export default defineConfig(({ mode }) => {
  // VITE_ 접두사 정책을 유지하기 위해 기본 접두사만 읽는다.
  const env = loadEnv(mode, process.cwd())
  // 백엔드를 로컬에서 직접 띄우는 경우 VITE_API_PROXY_TARGET으로 대상을 바꿀 수 있다. (예: http://localhost:8080)
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || DEFAULT_API_PROXY_TARGET

  return {
    plugins: [react(), tsconfigPaths()],
    server: {
      proxy: {
        // vercel.json의 /api rewrite와 같은 역할이다. 브라우저는 dev 서버 오리진만 호출하고
        // 실제 백엔드 호출은 dev 서버(서버사이드)가 대신한다.
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // 백엔드가 브라우저 오리진(localhost 등)을 CORS 화이트리스트에 두지 않아
              // Origin 헤더가 붙은 요청을 403으로 거절한다. Vite의 프록시는 원본 요청 헤더를
              // 그대로 전달하므로, Origin을 지워 Origin 없는 서버사이드 호출과 동일하게 만든다.
              // 이 줄을 지우면 모든 /api 요청이 즉시 403이 된다.
              proxyReq.removeHeader('origin')
            })
          }
        }
      }
    },
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: '.vitest/setup',
      include: ['**/test.{ts,tsx}']
    }
  }
})
