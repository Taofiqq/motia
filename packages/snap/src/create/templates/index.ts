import { generateTemplateSteps, Generator } from './generate'

export const templates: Record<string, Generator> = {
  nodejs: generateTemplateSteps('nodejs'),
  python: generateTemplateSteps('python'),
}
