import path from 'path'
import fs from 'fs'
import { executeCommand } from '../utils/execute-command'
import { pythonInstall } from '../install'
import { generateTypes } from '../generate-types'
import { version } from '../version'
import { CliContext } from '../cloud/config-utils'
import { setupTemplate } from './setup-template'
import { checkIfFileExists, checkIfDirectoryExists } from './utils'
import { pullRules } from './pull-rules'

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs' },
})

const getPackageManager = (dir: string): string => {
  if (checkIfFileExists(dir, 'yarn.lock')) {
    return 'yarn'
  } else if (checkIfFileExists(dir, 'pnpm-lock.yaml')) {
    return 'pnpm'
  } else if (checkIfFileExists(dir, 'package-lock.json')) {
    return 'npm'
  } else {
    return 'unknown'
  }
}

const installRequiredDependencies = async (packageManager: string, rootDir: string, context: CliContext) => {
  context.log('installing-dependencies', (message) => message.tag('info').append('Installing dependencies...'))

  const installCommand = {
    npm: 'npm install --save',
    yarn: 'yarn add',
    pnpm: 'pnpm add',
  }[packageManager]

  const dependencies = [`motia@${version}`, 'zod@3.24.4'].join(' ')
  const devDependencies = ['ts-node@10.9.2', 'typescript@5.7.3', '@types/react@18.3.18'].join(' ')

  try {
    await executeCommand(`${installCommand} ${dependencies}`, rootDir)
    await executeCommand(`${installCommand} -D ${devDependencies}`, rootDir)

    context.log('dependencies-installed', (message) => message.tag('success').append('Dependencies installed'))
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error)
  }
}

const preparePackageManager = async (rootDir: string, context: CliContext) => {
  let packageManager = 'npm'
  const detectedPackageManager = getPackageManager(rootDir)

  if (detectedPackageManager !== 'unknown') {
    context.log('package-manager-detected', (message) =>
      message.tag('info').append('Detected package manager').append(detectedPackageManager, 'gray'),
    )
    packageManager = detectedPackageManager
  } else {
    context.log('package-manager-using-default', (message) =>
      message.tag('info').append('Using default package manager').append(packageManager, 'gray'),
    )
  }

  return packageManager
}

const installNodeDependencies = async (rootDir: string, context: CliContext) => {
  const packageManager = await preparePackageManager(rootDir, context)

  await installRequiredDependencies(packageManager, rootDir, context).catch((error: unknown) => {
    context.log('failed-to-install-dependencies', (message) =>
      message.tag('failed').append('Failed to install dependencies'),
    )
    console.error(error)
  })

  return packageManager
}

const wrapUp = async (context: CliContext, packageManager: string) => {
  context.log('project-setup-completed', (message) =>
    message.tag('success').append('Project setup completed, happy coding!'),
  )
  context.log('package-manager-used', (message) =>
    message.tag('info').append('To start the development server, run').append(`${packageManager} run dev`, 'gray'),
  )
}

type Args = {
  projectName: string
  template: string
  cursorEnabled: boolean
  context: CliContext
  skipTutorialTemplates?: boolean
}

export const create = async ({ projectName, template, cursorEnabled, context }: Args): Promise<void> => {
  console.log(
    '\n\n' +
      `
         _____   ______  ______   ______     
 /'\\_/\`\\/\\  __\`\\/\\__  _\\/\\__  _\\ /\\  _  \\    
/\\      \\ \\ \\/\\ \\/_/\\ \\/\\/_/\\ \\/ \\ \\ \\L\\ \\   
\\ \\ \\__\\ \\ \\ \\ \\ \\ \\ \\ \\   \\ \\ \\  \\ \\  __ \\  
 \\ \\ \\_/\\ \\ \\ \\_\\ \\ \\ \\ \\   \\_\\ \\__\\ \\ \\/\\ \\ 
  \\ \\_\\\\ \\_\\ \\_____\\ \\ \\_\\  /\\_____\\\\ \\_\\ \\_\\
   \\/_/ \\/_/\\/_____/  \\/_/  \\/_____/ \\/_/\\/_/
      ` +
      '\n\n',
  )

  const isCurrentDir = projectName === '.' || projectName === './' || projectName === '.\\'
  const rootDir = isCurrentDir ? process.cwd() : path.join(process.cwd(), projectName)

  if (!isCurrentDir && !checkIfDirectoryExists(rootDir)) {
    fs.mkdirSync(path.join(rootDir))
    context.log('directory-created', (message) =>
      message.tag('success').append('Directory created ').append(projectName, 'gray'),
    )
  } else {
    context.log('directory-using', (message) => message.tag('info').append('Using current directory'))
  }

  if (!checkIfFileExists(rootDir, 'package.json')) {
    const packageJsonContent = {
      name: projectName,
      description: '',
      scripts: {
        postinstall: 'motia install',
        dev: 'motia dev',
        'generate-types': 'motia generate-types',
        build: 'motia build',
        clean: 'rm -rf dist node_modules python_modules .motia .mermaid',
        //'generate:config': 'motia get-config --output ./', TODO: doesnt work at the moment
      },
      keywords: ['motia'],
    }

    fs.writeFileSync(path.join(rootDir, 'package.json'), JSON.stringify(packageJsonContent, null, 2))

    context.log('package-json-created', (message) =>
      message.tag('success').append('File').append('package.json', 'cyan').append('has been created.'),
    )
  } else {
    const packageJsonPath = path.join(rootDir, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

    if (!packageJson.scripts) {
      packageJson.scripts = {}
    }

    if (!packageJson.scripts.dev) {
      packageJson.scripts.dev = 'motia dev'
    } else {
      packageJson.scripts.olddev = packageJson.scripts.dev
      packageJson.scripts.dev = 'motia dev'
      context.log('dev-command-already-exists', (message) =>
        message.tag('warning').append('dev command already exists in package.json'),
      )
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    context.log('dev-command-updated', (message) =>
      message
        .tag('success')
        .append('Updated')
        .append('dev', 'gray')
        .append('command to')
        .append('package.json', 'gray'),
    )
  }

  if (!checkIfFileExists(rootDir, 'tsconfig.json')) {
    const tsconfigContent = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'Node',
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        allowJs: true,
        outDir: 'dist',
        rootDir: '.',
        baseUrl: '.',
        jsx: 'react-jsx',
      },
      include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', 'types.d.ts'],
      exclude: ['node_modules', 'dist', 'tests'],
    }

    fs.writeFileSync(path.join(rootDir, 'tsconfig.json'), JSON.stringify(tsconfigContent, null, 2))
    context.log('tsconfig-json-created', (message) =>
      message.tag('success').append('File').append('tsconfig.json', 'cyan').append('has been created.'),
    )
  }

  if (!checkIfFileExists(rootDir, '.gitignore')) {
    const gitignoreContent = [
      'node_modules',
      'python_modules',
      '.venv',
      'venv',
      '.motia',
      '.mermaid',
      'dist',
      '*.pyc',
    ].join('\n')

    fs.writeFileSync(path.join(rootDir, '.gitignore'), gitignoreContent)
    context.log('gitignore-created', (message) =>
      message.tag('success').append('File').append('.gitignore', 'cyan').append('has been created.'),
    )
  }

  if (cursorEnabled) {
    await pullRules({ force: true, rootDir }, context)
  }

  if (template) {
    await setupTemplate(template, rootDir, context)
  }

  const packageManager = await installNodeDependencies(rootDir, context)

  if (template === 'python') {
    await pythonInstall({ baseDir: rootDir })
  }

  await generateTypes(rootDir)
  await wrapUp(context, packageManager)

  return
}
