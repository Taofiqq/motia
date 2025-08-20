import path from 'path'
import fs from 'fs'

import { checkIfDirectoryExists, checkIfFileExists } from './utils'
import { CliContext } from '@/cloud/config-utils'
import { setupTemplate } from './setup-template'

type Args = {
  context: CliContext
}

export const createTutorialFlow = async ({ context }: Args) => {
  const rootDir = process.cwd()

  if (!checkIfFileExists(rootDir, 'motia-workbench.json')) {
    context.log('invalid-project', (message) =>
      message
        .tag('failed')
        .append(
          'In order to setup the Motia tutorial you need to be in a valid Motia project, motia-workbench.json not found, if this is not a Motia project you can create one using the motia create cli command.',
        ),
    )
    return
  }

  const stepsDir = path.join(rootDir, 'steps')
  if (!checkIfDirectoryExists(stepsDir)) {
    fs.mkdirSync(stepsDir)
    context.log('steps-directory-created', (message) =>
      message.tag('success').append('Folder').append('steps', 'cyan').append('has been created.'),
    )
  }

  if (!checkIfDirectoryExists(path.join(stepsDir, 'basic-tutorial'))) {
    fs.mkdirSync(path.join(stepsDir, 'basic-tutorial'))
  }

  await setupTemplate('basic-tutorial', stepsDir, context)

  context.log('tutorial-flow-setup-completed', (message) =>
    message.tag('success').append('Tutorial flow setup completed, you can now start the tutorial from Workbench.'),
  )
}
