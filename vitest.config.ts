import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        // simulações inteiras: em máquina ocupada passam fácil dos 5 s padrão
        testTimeout: 30000,
        include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    },
});
