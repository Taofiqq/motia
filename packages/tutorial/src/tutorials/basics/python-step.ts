import { TutorialStep } from '@/types/tutorial'
import { v4 as uuidv4 } from 'uuid'

const segmentId = 'basic'

export const pythonStepSteps: TutorialStep[] = [
  {
    elementXpath: `//div[@data-testid="node-newordernotifications"]`,
    segmentId,
    title: 'Python Step',
    description: `Motia supports multiple languages, here is an example of an <b>event</b> step written in <b>Python</b>. Let's take a look at this step definition.<br/><br/> 💡 You can learn more about Motia's supported languages in our <a href="https://www.motia.dev/docs#working-with-multiple-languages" target="_blank">docs</a>.`,
    id: uuidv4(),
    clickSelectorBeforeNext: `//button[@data-testid="open-code-preview-button-newordernotifications"]`,
    waitForSelector: `(//div[@id="app-sidebar-container"]//span[contains(text(), 'class')])[1]`,
  },
  {
    elementXpath: `(//div[@id="app-sidebar-container"]//span[contains(text(), 'NewOrderNotificationInput')])[1]/..`,
    segmentId,
    title: 'Typed inputs',
    description: `In this <b>event</b> step example we require an input, Motia supports typed inputs using <b>pydantic</b> like this instance named "<i>NewOrderNotificationInput</i>".<br/><br/> Motia's core parses these typed inputs and generates type safety checks for all data emitted to their associated topics.`,
    id: uuidv4(),
    clickSelectorBeforePrev: '//div[@id="app-sidebar-container"]//button[@data-testid="close-panel"]',
  },
  {
    elementXpath: `//div[@id="app-sidebar-container"]//span[contains(text(), "handler")]`,
    segmentId,
    title: 'Step Handler',
    description: `The <b>event</b> step handler in python follows the same standard as in Typescript/Javascript, you receive the emitted data as the first argument, and the second argument contains the Motia step context (logger, traceId, state, and emit).`,
    id: uuidv4(),
    clickSelectorBeforeNext: '//div[@id="app-sidebar-container"]//button[@data-testid="close-panel"]',
    requiredSelectorOnPrev: `//div[@id="app-sidebar-container"]//span[contains(text(), "handler")]`,
    clickRequireSelectorMissingOnPrev: `//button[@data-testid="open-code-preview-button-newordernotifications"]`,
  },
]
