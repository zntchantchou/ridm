import type Pulses from "./Pulses";
// import Sequencer from "./Sequencer";
import StepQueue, { type Step } from "./StepQueue";

class UI {
  audioContext: null | AudioContext;
  lastStep: Step | null = null;
  isPlaying = false;
  animationId: number | null = null;
  pulses: Pulses | null = null;
  constructor(AC: AudioContext, pulses: Pulses) {
    this.audioContext = AC;
    this.pulses = pulses;
  }
  /** start the animation */
  start() {
    console.log("[UI start]");
    this.isPlaying = true;
    this.animationId = requestAnimationFrame(this.draw);
  }

  /** pause the animation */
  pause() {
    console.log("[UI stop]");
    this.isPlaying = false;
    // cancel animation frame
  }

  /** stop the animation */
  stop() {
    console.log("[UI stop]");
    this.isPlaying = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  draw = () => {
    let currStep = this.lastStep;
    // console.log("[UI draw]");
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
    // look for a subdivision through all unique stepper key

    // for(const )
    // for (const p of this.pulses) {
    //   const
    // }
    // for (const stepperKey of Sequencer.steppersMap.keys()) {
    //   const key = parseInt(stepperKey);
    //   if (step.totalSteps > key && step.totalSteps % key === 0) {
    //     console.log("SUBDIVISION FOUND STEP ", step);
    //     console.log("SUBDIVISION KEY", key);
    //     const subDivider = step.totalSteps / key;
    //     if (step.stepNumber % subDivider === 0) {
    //       const prevStepValue =
    //         step.stepNumber === 0
    //           ? step.totalSteps / subDivider - 1 // for 0 previous step is the last step
    //           : step.stepNumber / subDivider - 1;
    //       const lastStep = this.selectSteps(prevStepValue, key);
    //       lastStepElements.push(...lastStep);
    //       currentStepElements.push(
    //         ...this.selectSteps(step.stepNumber / subDivider, key)
    //       );
    //     }
    //   }
    // }
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
