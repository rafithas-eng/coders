name: config-new-module
description: Cria um novo módulo de negócios dentro da pasta `modules`. A skill gera uma estrutura determinística de arquivos a partir de *assets* internos e atualiza o workspace para incluir o novo módulo.

---

# Skill: config-new-module

Objetivo:
- Criar um novo módulo em `modules/<nome-do-modulo>` usando arquivos determinísticos providos na pasta `assets` desta skill.

Regras obrigatórias:
- NÃO executar se o `@namespace` NÃO for informado. A skill exige o argumento `@namespace` para rodar.
- O nome do módulo (ex.: `auth`) é obrigatório.

Uso (execução determinística):

```bash
node scripts/setup.js <nome-do-modulo> @namespace
```

Exemplo:

```bash
node scripts/setup.js auth @novo-projeto
```

O que a skill faz (resumo dos passos):
1. Verifica que `@namespace` foi passado; em caso contrário aborta com erro.
2. Cria a pasta `modules/` se não existir.
3. Cria `modules/<nome-do-modulo>/` e copia os arquivos determinísticos de `assets/` para lá, substituindo placeholders (por exemplo `{{NAMESPACE}}` no `package.json`).
4. Garante que o `workspaces` do `package.json` raiz contenha `modules/*`.
5. Garante que o `devDependencies` do `package.json` raiz contenha `ts-node` (versão mínima `^10.9.2`).
6. Adiciona dependência em `apps/frontend/package.json` e `apps/backend/package.json`:

```json
"dependencies": {
  "@novo-projeto/<nome-do-modulo>": "*"
}
```

(Substitui `@novo-projeto` pelo `@namespace` informado.)

7. Executa `npm install` na raiz, depois `npm run build` e, por fim, executa os testes do módulo criado (`npm test` dentro do módulo).

Arquivos criados em `modules/<nome-do-modulo>` (determinísticos):
- `jest.config.ts`
- `tsconfig.json` (ou sym link/arquivo conforme assets)
- `package.json` (com `name` = `@<NAMESPACE>/<nome-do-modulo>` e scripts mínimos)
- `src/index.ts` (entry)
- `test/index.test.ts`

Observações de segurança e operação:
- A skill altera `package.json` de apps existentes; confirme o commit depois de revisar.
- Se `npm install` falhar, o script interrompe e exibe a razão.

Arquivos auxiliares incluídos nesta skill:
- `assets/` — templates dos arquivos que serão copiados para o módulo.
- `scripts/setup.js` — script determinístico que executa a operação descrita.
- `scripts/verify.js` — (opcional) verificações pós-criação.

Referência de execução (para o usuário):
- Após criação, você pode rodar manualmente:

```bash
npm install
npm run build
cd modules/<nome-do-modulo>
npm test
```

---

Se preferir, posso executar a criação agora com um módulo de exemplo (peça o nome e o namespace).