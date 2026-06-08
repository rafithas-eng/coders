#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
if (args.length < 2) {
  console.error('Uso: node scripts/verify.js <nome-do-modulo> @namespace')
  process.exit(1)
}
const moduleName = args[0]
const namespace = args[1]
// repoRoot should point to the repository root (four levels up from this script)
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..')
const moduleDir = path.join(repoRoot, 'modules', moduleName)

if (!fs.existsSync(moduleDir)) {
  console.error('Módulo não encontrado:', moduleDir)
  process.exit(2)
}

const pkg = JSON.parse(fs.readFileSync(path.join(moduleDir, 'package.json'), 'utf8'))
if (pkg.name !== `${namespace}/${moduleName}`) {
  console.error('package.json.name incompatível:', pkg.name)
  process.exit(3)
}

console.log('Verificação rápida OK para', `${namespace}/${moduleName}`)
