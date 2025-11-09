// vitest.setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './src/mocks/tiled'
import 'vitest-canvas-mock';  // For using plotly in tests

// Allow plotly.js to be used with jsdom
window.URL.createObjectURL = () => { return null };

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
