#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const child = require('child_process')

function log(...args) { console.log('[config-new-module]', ...args) }

function exitErr(msg) { console.error('[config-new-module] ERRO:', msg); process.exit(1) }

const args = process.argv.slice(2)
if (args.length < 2) {
  exitErr('Uso: node scripts/setup.js <nome-do-modulo> @namespace')
}

const moduleName = args[0]
let namespace = args[1]
if (!namespace.startsWith('@')) {
  exitErr('Namespace deve iniciar com @ (ex: @novo-projeto)')
}
// normalize
namespace = namespace.replace(/^@/, '@')

const repoRoot = path.resolve(__dirname, '..', '..', '..', '..')
const skillDir = path.resolve(__dirname, '..')
const assetsDir = path.join(skillDir, 'assets')
const modulesDir = path.join(repoRoot, 'modules')
const newModuleDir = path.join(modulesDir, moduleName)

// 1. Ensure assets exist
if (!fs.existsSync(assetsDir)) exitErr('Pasta assets/ não encontrada na skill')

// 2. Create modules/ if needed
if (!fs.existsSync(modulesDir)) fs.mkdirSync(modulesDir, { recursive: true })

// 3. Create module folder
if (fs.existsSync(newModuleDir)) exitErr(`O módulo ${moduleName} já existe em modules/`)
fs.mkdirSync(newModuleDir, { recursive: true })

// Copy assets files deterministically
function copyAsset(relPath, destPath) {
  const src = path.join(assetsDir, relPath)
  if (!fs.existsSync(src)) exitErr(`Asset não encontrado: ${relPath}`)
  const content = fs.readFileSync(src, 'utf8')
  fs.mkdirSync(path.dirname(destPath), { recursive: true })
  fs.writeFileSync(destPath, content, 'utf8')
  log('Criado', path.relative(repoRoot, destPath))
}

// package.json: replace placeholders
const pkgTemplate = fs.readFileSync(path.join(assetsDir, 'package.json.template'), 'utf8')
const pkgContent = pkgTemplate.replace(/{{NAMESPACE}}/g, namespace).replace(/{{MODULE}}/g, moduleName)
fs.writeFileSync(path.join(newModuleDir, 'package.json'), pkgContent, 'utf8')
log('Criado', path.relative(repoRoot, path.join(newModuleDir, 'package.json')))

// copy jest.config.ts and tsconfig
copyAsset('jest.config.ts', path.join(newModuleDir, 'jest.config.ts'))
copyAsset('tsconfig.json', path.join(newModuleDir, 'tsconfig.json'))

// copy src and test folders
function copyFolder(srcRel, destRel) {
  const srcDir = path.join(assetsDir, srcRel)
  const destDir = path.join(newModuleDir, destRel)
  if (!fs.existsSync(srcDir)) return
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name)
      const rel = path.relative(srcDir, full)
      const dest = path.join(destDir, rel)
      const stat = fs.statSync(full)
      if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true })
        walk(full)
      } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        fs.copyFileSync(full, dest)
        log('Criado', path.relative(repoRoot, dest))
      }
    }
  }
  walk(srcDir)
}
copyFolder('src', 'src')
copyFolder('test', 'test')

// 4. Update root package.json: ensure workspaces includes modules/* and ts-node devDependency
const rootPkgPath = path.join(repoRoot, 'package.json')
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'))
rootPkg.workspaces = rootPkg.workspaces || []
if (!rootPkg.workspaces.includes('modules/*')) {
  rootPkg.workspaces.push('modules/*')
  log('Adicionando modules/* em workspaces do package.json raiz')
}
rootPkg.devDependencies = rootPkg.devDependencies || {}
if (!rootPkg.devDependencies['ts-node']) {
  rootPkg.devDependencies['ts-node'] = '^10.9.2'
  log('Adicionando ts-node em devDependencies do package.json raiz')
}
fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2), 'utf8')

// 5. Update apps/frontend and apps/backend package.json dependencies
const apps = ['apps/frontend/package.json', 'apps/backend/package.json']
for (const rel of apps) {
  const p = path.join(repoRoot, rel)
  if (!fs.existsSync(p)) continue
  const pj = JSON.parse(fs.readFileSync(p, 'utf8'))
  pj.dependencies = pj.dependencies || {}
  const depName = `${namespace}/${moduleName}`
  if (!pj.dependencies[depName]) {
    pj.dependencies[depName] = '*'
    fs.writeFileSync(p, JSON.stringify(pj, null, 2), 'utf8')
    log('Atualizado', rel)
  }
}

// 6. Create NestJS module in apps/backend/src/modules/<moduleName>
function toPascalCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
const modulePascal = toPascalCase(moduleName)
const nestModuleDir = path.join(repoRoot, 'apps', 'backend', 'src', 'modules', moduleName)

if (!fs.existsSync(nestModuleDir)) {
  fs.mkdirSync(nestModuleDir, { recursive: true })
}

const nestTemplatesDir = path.join(assetsDir, 'nestjs')

const nestModuleContent = fs.readFileSync(path.join(nestTemplatesDir, 'module.ts.template'), 'utf8')
  .replace(/{{MODULE_PASCAL}}/g, modulePascal)
  .replace(/{{MODULE}}/g, moduleName)
const nestModuleFile = path.join(nestModuleDir, `${moduleName}.module.ts`)
fs.writeFileSync(nestModuleFile, nestModuleContent, 'utf8')
log('Criado', path.relative(repoRoot, nestModuleFile))

const nestControllerContent = fs.readFileSync(path.join(nestTemplatesDir, 'controller.ts.template'), 'utf8')
  .replace(/{{MODULE_PASCAL}}/g, modulePascal)
  .replace(/{{MODULE}}/g, moduleName)
const nestControllerFile = path.join(nestModuleDir, `${moduleName}.controller.ts`)
fs.writeFileSync(nestControllerFile, nestControllerContent, 'utf8')
log('Criado', path.relative(repoRoot, nestControllerFile))

// Register module in apps/backend/src/app.module.ts
const appModulePath = path.join(repoRoot, 'apps', 'backend', 'src', 'app.module.ts')
let appModuleContent = fs.readFileSync(appModulePath, 'utf8')

if (!appModuleContent.includes(`${modulePascal}Module`)) {
  const importLine = `import { ${modulePascal}Module } from './modules/${moduleName}/${moduleName}.module';`

  // Insert import after last import statement
  const lines = appModuleContent.split('\n')
  let lastImportIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) lastImportIdx = i
  }
  if (lastImportIdx >= 0) {
    lines.splice(lastImportIdx + 1, 0, importLine)
    appModuleContent = lines.join('\n')
  }

  // Add to imports array: find closing ] of the imports: [...] block via bracket tracking
  const importsStart = appModuleContent.indexOf('imports: [')
  if (importsStart >= 0) {
    let depth = 0
    let closeIdx = -1
    for (let i = importsStart; i < appModuleContent.length; i++) {
      if (appModuleContent[i] === '[') depth++
      else if (appModuleContent[i] === ']') {
        depth--
        if (depth === 0) { closeIdx = i; break }
      }
    }
    if (closeIdx >= 0) {
      const lineStart = appModuleContent.lastIndexOf('\n', closeIdx)
      appModuleContent =
        appModuleContent.slice(0, lineStart) +
        `\n    ${modulePascal}Module,` +
        appModuleContent.slice(lineStart)
    }
  }

  fs.writeFileSync(appModulePath, appModuleContent, 'utf8')
  log('Atualizado apps/backend/src/app.module.ts')
}

// 7. Create frontend structure in apps/frontend
const frontendTemplatesDir = path.join(assetsDir, 'frontend')

function renderTemplate(templatePath, replacements) {
  let content = fs.readFileSync(templatePath, 'utf8')
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(key, 'g'), value)
  }
  return content
}

const replacements = { '{{MODULE_PASCAL}}': modulePascal, '{{MODULE}}': moduleName }

const frontendRouteDir = path.join(repoRoot, 'apps', 'frontend', 'src', 'app', '(private)', moduleName)
fs.mkdirSync(frontendRouteDir, { recursive: true })
const routeContent = renderTemplate(path.join(frontendTemplatesDir, 'route.page.tsx.template'), replacements)
fs.writeFileSync(path.join(frontendRouteDir, 'page.tsx'), routeContent, 'utf8')
log('Criado', path.relative(repoRoot, path.join(frontendRouteDir, 'page.tsx')))

const frontendPagesDir = path.join(repoRoot, 'apps', 'frontend', 'src', 'modules', moduleName, 'pages')
fs.mkdirSync(frontendPagesDir, { recursive: true })
const pageContent = renderTemplate(path.join(frontendTemplatesDir, 'page.tsx.template'), replacements)
fs.writeFileSync(path.join(frontendPagesDir, `${moduleName}.page.tsx`), pageContent, 'utf8')
log('Criado', path.relative(repoRoot, path.join(frontendPagesDir, `${moduleName}.page.tsx`)))

const frontendComponentsDir = path.join(repoRoot, 'apps', 'frontend', 'src', 'modules', moduleName, 'components')
fs.mkdirSync(frontendComponentsDir, { recursive: true })
const componentContent = renderTemplate(path.join(frontendTemplatesDir, 'component.tsx.template'), replacements)
fs.writeFileSync(path.join(frontendComponentsDir, `${moduleName}.component.tsx`), componentContent, 'utf8')
log('Criado', path.relative(repoRoot, path.join(frontendComponentsDir, `${moduleName}.component.tsx`)))

// 8. Run npm install, build and tests
try {
  log('Executando: npm install (raiz)')
  child.execSync('npm install', { cwd: repoRoot, stdio: 'inherit' })
  log('Executando: npm run build (raiz)')
  child.execSync('npm run build', { cwd: repoRoot, stdio: 'inherit' })
  log('Executando: npm test (módulo)')
  // run tests inside module
  child.execSync('npm test', { cwd: newModuleDir, stdio: 'inherit' })
  log('Concluído com sucesso')
} catch (err) {
  exitErr(err.message)
}

