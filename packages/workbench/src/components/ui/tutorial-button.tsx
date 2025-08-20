import { MotiaTutorial, TutorialConfig } from '@motiadev/tutorial'
import { Button } from '@motiadev/ui'
import { Book } from 'lucide-react'
import { useStreamGroup } from '@motiadev/stream-client-react'
import { FlowResponse } from '@/types/flow'
import { FC, useCallback, useEffect, useState } from 'react'
import { useFlowStore } from '@/stores/use-flow-store'
import { Tooltip } from './tooltip'
import { useAnalytics } from '@/lib/analytics'

export const TutorialButton: FC = () => {
  const { track } = useAnalytics()
  const [isTutorialFlowMissing, setIsTutorialFlowMissing] = useState(true)
  const selectFlowId = useFlowStore((state) => state.selectFlowId)

  const { data: flows } = useStreamGroup<FlowResponse>({
    streamName: '__motia.flows',
    groupId: 'default',
  })

  const startTutorial = useCallback(
    (resetState = false) => {
      selectFlowId('basic-tutorial')

      const tutorialStepIndex = new URLSearchParams(window.location.search).get('tutorialStepIndex')
      const config: TutorialConfig = {
        resetSkipState: resetState,
        onSkipTutorialEvent: () => track('motia-tutorial_skipped'),
        onTutorialCompletedEvent: () => track('motia-tutorial_completed'),
      }
      if (tutorialStepIndex && !resetState) {
        config.initialStepIndex = Number(tutorialStepIndex)
      }

      track('motia-tutorial_start', { tutorialConfig: config })

      MotiaTutorial.start(config)

      if (resetState) {
        const url = new URL(window.location.href)
        url.searchParams.delete('tutorialStepIndex')
        window.history.replaceState(null, '', url)
      }
    },
    [selectFlowId, track],
  )

  useEffect(() => {
    let nextFlowConfig = flows ? Object.values(flows).find((flow) => flow.name === 'basic-tutorial') : undefined

    if (import.meta.env.VITE_MOTIA_TUTORIAL_DISABLED || !nextFlowConfig) {
      console.debug('[motia-tutorial] disabled or flow not found', { nextFlowConfig, flows })
      return
    }

    setIsTutorialFlowMissing(false)

    if (localStorage.getItem('motia-tutorial-skipped')) {
      console.debug('[motia-tutorial] tutorial skipped')
      return
    }

    const timeout = setTimeout(() => startTutorial(), 300)

    return () => {
      clearTimeout(timeout)
      MotiaTutorial.close()
    }
  }, [flows, startTutorial])

  if (import.meta.env.VITE_MOTIA_TUTORIAL_DISABLED) {
    return null
  }

  const onTutorialButtonClick = () => {
    track('motia-tutorial_button-click')

    if (isTutorialFlowMissing) {
      return
    }

    startTutorial(true)
  }

  const trigger = (
    <Button data-testid="tutorial-trigger" variant="default" onClick={() => onTutorialButtonClick()}>
      <Book className="h-4 w-4" />
      Tutorial
    </Button>
  )

  if (isTutorialFlowMissing) {
    return (
      <Tooltip
        content={
          <div className="flex flex-col gap-4 p-4 max-w-[320px]">
            <p className="text-sm wrap-break-word p-0 m-0">
              In order to start the tutorial, you need to download the tutorial steps using the Motia CLI. In your
              terminal execute:
            </p>
            <pre className="text-sm font-bold">motia generate tutorial-flow</pre>
          </div>
        }
      >
        {trigger}
      </Tooltip>
    )
  }

  return trigger
}
