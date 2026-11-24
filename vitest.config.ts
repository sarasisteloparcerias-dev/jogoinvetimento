import { defineConfig } from 'vitest/config'

// Testes da lógica do jogo (economia, fases, histórias, mini-jogos). Os testes no browser estão em tests/e2e.
export default defineConfig({
  test: { include: ['tests/unit/**/*.test.ts'] },
})
