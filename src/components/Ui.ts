import Sequencer from "./Sequencer";
import StepQueue, { type Step } from "./StepQueue";

class UI {
  audioContext: null | AudioContext;
  lastStep: Step | null = null;
  isPlaying = false;
  animationId: number | null = null;
  constructor(AC: AudioContext) {
    this.audioContext = AC;
  }

  start() {
    // request the animationframe on draw
    console.log("[UI start]");
    this.isPlaying = true;
    this.animationId = requestAnimationFrame(this.draw);
  }

  pause() {
    console.log("[UI stop]");
    this.isPlaying = false;
    // cancel animation frame
  }

  stop() {
    console.log("[UI stop]");
    this.isPlaying = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
    // cancel animation frame
  }

  draw = () => {
    let currStep = this.lastStep;
    // console.log("[UI draw]");
    // pop queue and draw
    if (!this.audioContext) return;
    while (
      StepQueue.size() &&
      StepQueue.head().time < this.audioContext.currentTime
    ) {
      currStep = StepQueue.pop();
    }
    if (currStep && currStep !== this.lastStep) {
      this.updateUI(currStep);
      this.lastStep = currStep;
    }
    if (this.isPlaying) requestAnimationFrame(this.draw);
  };

  private selectSteps(stepNumber: number, steps: number) {
    // console.log("SELECT STEP : ", stepNumber, steps);
    return Array.from(
      document.querySelectorAll(
        `[data-steps="${steps}"][data-step="${stepNumber}"]`
      )
    ) as HTMLDivElement[];
  }

  private updateUI(step: Step) {
    // console.log("UPDATE UI");
    const lastStepElements = this.selectSteps(
      this.lastStep?.stepNumber as number,
      step.totalSteps
    );

    const currentStepElements = this.selectSteps(
      step.stepNumber,
      step.totalSteps
    );

    for (const stepperKey of Sequencer.steppersMap.keys()) {
      const key = parseInt(stepperKey);
      if (step.totalSteps > key && step.totalSteps % key === 0) {
        const subDivider = step.totalSteps / key;
        if (step.stepNumber % subDivider === 0) {
          console.log("KEY FOUND => ", key);
          console.log("SUBDIVIER => ", subDivider);
          const prevStepValue =
            step.stepNumber === 0
              ? step.totalSteps / subDivider - 1
              : step.stepNumber / subDivider - 1;
          const prevStep = this.selectSteps(prevStepValue, key);
          lastStepElements.push(...prevStep);
          currentStepElements.push(
            ...this.selectSteps(step.stepNumber / subDivider, key)
          );
        }
      }
    }
    if (lastStepElements.length && currentStepElements) {
      currentStepElements.forEach((elt, i) => {
        elt.dataset.ticking = "on";
        if (lastStepElements[i]) {
          lastStepElements[i].dataset.ticking = "off";
        } // unhighlight the last ticking step if there was one
      });
    }
  }
}

export default UI;
