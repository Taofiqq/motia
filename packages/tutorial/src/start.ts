import './theme.css'
import { TutorialConfig, TutorialStep } from './types/tutorial'
import driver from './driver'
import { tutorials } from './tutorials'
import { closeTutorial } from './close'
import { Driver, PopoverDOM } from 'driver.js'

const getSteps = (tutorialId: string) => {
  if (tutorialId in tutorials) {
    return tutorials[tutorialId as keyof typeof tutorials].steps
  }

  return tutorials.basic.steps
}

const clickElement = (
  selector: string,
  useKeyDown?: boolean,
  onElementFound?: () => void,
  onElementNotFound?: () => void,
) => {
  const element = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)

  if (element.singleNodeValue) {
    if (useKeyDown) {
      ;(element.singleNodeValue as HTMLElement).dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13 }),
      )
    } else {
      ;(element.singleNodeValue as HTMLElement).click()
    }

    onElementFound?.()
  } else {
    onElementNotFound?.()
  }
}

const waitForElement = (xpath: string, onElementFound: () => void, onTimeoutExpired: () => void) => {
  let timeout = 3000
  const isXPath = xpath.match(/\/\//)

  const checkElement = () => {
    while (timeout > 0) {
      console.debug('[motia-tutorial] evaluating path', xpath)

      const element = isXPath
        ? document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)?.singleNodeValue
        : document.querySelector(xpath)

      console.debug('[motia-tutorial] evaluating result', element)

      if (element) {
        onElementFound()
        return
      }

      timeout -= 300

      if (timeout <= 0) {
        console.error('[motia-tutorial] timeout waiting for element', xpath)
        onTimeoutExpired()
        return
      }

      // Schedule next check after 300ms delay
      setTimeout(checkElement, 300)
      return
    }
  }

  checkElement()
}

export const startTutorial = (config?: TutorialConfig) => {
  if (window.localStorage.getItem('motia-tutorial-skipped') && !config?.resetSkipState) {
    return
  }

  if (config?.resetSkipState) {
    window.localStorage.removeItem('motia-tutorial-skipped')
  }

  const tutorialId = config?.tutorialId ?? 'basic'

  let tutorialDriver: Driver | undefined

  console.debug('[motia-tutorial] start', { tutorialId })

  const steps = getSteps(tutorialId)

  if (!steps.length) {
    console.error('[motia-tutorial] no steps found for tutorial', { tutorialId })
    return
  }

  const driveTutorial = () => {
    tutorialDriver = driver({
      showProgress: true,
      overlayOpacity: 0.4,
      nextBtnText: 'Next',
      prevBtnText: '←',
      // NOTE: we map the internal step definitions into the Driver.js structure in order to avoid injecting dependencies from the UI into the step definitions
      steps: steps.map((step: TutorialStep, currentStepIndex) => ({
        element: step.elementXpath.match('//')
          ? () => {
              const result = document.evaluate(
                step.elementXpath,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null,
              )
              return result.singleNodeValue as Element
            }
          : step.elementXpath,
        popover: {
          title: `<h3 class="popover-title">${step.title}</h3>`,
          description: `<p class="popover-description">${step.description}</p>`,
          position: step.position,
          onPopoverRender(popover: PopoverDOM) {
            if (step.image) {
              const image = document.createElement('img')
              image.src = step.image
              image.className = 'driver-popover-image'
              popover.wrapper.prepend(image)
            }

            const container = document.createElement('div')
            container.className = 'tutorial-opt-out-container'
            const secondButton = document.createElement('button')
            secondButton.innerText = 'Close'
            secondButton.className = 'tutorial-opt-out-button'
            secondButton.type = 'button'

            secondButton.addEventListener('click', () => {
              config?.onSkipTutorialEvent?.()
              tutorialDriver?.destroy()
              window.localStorage.setItem('motia-tutorial-skipped', 'true')
            })

            container.appendChild(secondButton)
            popover.wrapper.appendChild(container)
          },
          onNextClick: () => {
            if (tutorialDriver?.isLastStep()) {
              config?.onTutorialCompletedEvent?.()
              window.localStorage.setItem('motia-tutorial-skipped', 'true')
            }

            step?.runScriptBeforeNext?.()

            if (step.clickSelectorBeforeNext) {
              clickElement(step.clickSelectorBeforeNext, step.useKeyDownEventOnClickBeforeNext)
            }

            if (step.waitForSelector) {
              waitForElement(
                step.waitForSelector,
                () => tutorialDriver?.moveNext(),
                () => tutorialDriver?.moveNext(),
              )
              return
            }

            tutorialDriver?.moveNext()
          },
          onPrevClick: () => {
            if (!tutorialDriver?.hasPreviousStep()) {
              return
            }

            const previousStep = steps[currentStepIndex - 1]

            if (!previousStep) {
              tutorialDriver?.movePrevious()
              return
            }

            const defaultMovePreviousActivities = () => {
              if (step.clickSelectorBeforePrev) {
                clickElement(step.clickSelectorBeforePrev, step.useKeyDownEventOnClickBeforeNext)
              }

              console.debug('[motia-tutorial] proceeding with prev step')

              previousStep?.runScriptBeforePrev?.()

              if (step.waitForSelectorOnPrev) {
                waitForElement(
                  step.waitForSelectorOnPrev,
                  () => tutorialDriver?.movePrevious(),
                  () => tutorialDriver?.movePrevious(),
                )
                return
              }

              if (previousStep?.goBackStepCountOnPrev) {
                tutorialDriver?.moveTo(currentStepIndex - previousStep.goBackStepCountOnPrev)

                return
              }

              tutorialDriver?.movePrevious()
            }

            if (previousStep.requiredSelectorOnPrev) {
              const element = document.evaluate(
                previousStep.requiredSelectorOnPrev,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null,
              )

              console.debug('[motia-tutorial] on prev required selector result', element)

              if (!element?.singleNodeValue && previousStep.clickRequireSelectorMissingOnPrev) {
                let clickTargets = []

                if (!Array.isArray(previousStep.clickRequireSelectorMissingOnPrev)) {
                  clickTargets = [previousStep.clickRequireSelectorMissingOnPrev]
                } else {
                  clickTargets = previousStep.clickRequireSelectorMissingOnPrev
                }

                const onElementFound = () => {
                  waitForElement(
                    previousStep.requiredSelectorOnPrev!,
                    () => {
                      console.debug('[motia-tutorial] wait for success')
                      previousStep?.runScriptOnRequiredSelectorOnPrevFound?.()
                      waitForElement(
                        previousStep.elementXpath,
                        () => defaultMovePreviousActivities(),
                        () => defaultMovePreviousActivities(),
                      )
                    },
                    () => {
                      console.debug('[motia-tutorial] wait for failed, continue')
                      tutorialDriver?.movePrevious()
                    },
                  )
                }

                for (let i = 0; i < clickTargets.length; i += 1) {
                  const isLastTarget = i === clickTargets.length - 1
                  const currentTarget = clickTargets[i]

                  const selector = typeof currentTarget === 'object' ? currentTarget.target : currentTarget

                  const clickAction = () =>
                    clickElement(
                      selector,
                      typeof currentTarget === 'object' ? currentTarget?.useKeyDown : false,
                      isLastTarget ? onElementFound : undefined,
                      isLastTarget ? () => defaultMovePreviousActivities() : undefined,
                    )

                  if (i > 0) {
                    waitForElement(
                      selector,
                      () => clickAction(),
                      () => defaultMovePreviousActivities(),
                    )
                  } else {
                    clickAction()
                  }
                }

                return
              }

              defaultMovePreviousActivities()
              return
            }

            defaultMovePreviousActivities()
          },
          ...(['intro', 'end'].includes(step.id) ? { popoverClass: 'driver-popover driver-popover-intro-step' } : {}),
        },
      })),
      onDestroyStarted: () => {
        if (tutorialDriver?.isLastStep()) {
          window.localStorage.setItem('motia-tutorial-skipped', 'true')
        }

        closeTutorial(true)
      },
      onDestroyed: () => {
        closeTutorial(true)
      },
    })

    tutorialDriver.drive(config?.initialStepIndex)
  }

  waitForElement(
    steps[0].elementXpath,
    () => driveTutorial(),
    () => {
      alert(`Oops! We've encountered an issue while loading the tutorial. Please contact support.`)
    },
  )
}
