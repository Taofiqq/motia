export type TutorialStep = {
  id: string
  title: string
  image?: string
  description?: string
  position?: 'left' | 'right' | 'top' | 'bottom'
  elementXpath: string
  segmentId: string
  clickSelectorBeforeNext?: string
  clickSelectorBeforePrev?: string
  waitForSelector?: string
  waitForSelectorOnPrev?: string
  runScriptBeforeNext?: () => void
  runScriptBeforePrev?: () => void
  useKeyDownEventOnClickBeforeNext?: boolean
  requiredSelectorOnPrev?: string
  clickRequireSelectorMissingOnPrev?: string | { target: string; useKeyDown?: boolean }[]
  runScriptOnRequiredSelectorOnPrevFound?: () => void
  goBackStepCountOnPrev?: number
}

export type Tutorial = {
  id: string
  title: string
  description?: string
  steps: TutorialStep[]
}

export type TutorialConfig = {
  tutorialId?: 'basic' // | add more tutorial id's in here
  segmentId?: string
  initialStepIndex?: number
  resetSkipState?: boolean
  onSkipTutorialEvent?: () => void
  onTutorialCompletedEvent?: () => void
}
