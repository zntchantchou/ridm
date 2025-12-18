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
    console.log("[UI draw]");
    if (!this.audioContext) return;
    const currentTime = this.audioContext.currentTime;
    // console.log("STEPQUEUE ", StepQueue, StepQueue.size(), currentTime);
    while (StepQueue.size() && StepQueue.head().time < currentTime) {
      // console.log("STEPQUEUE BOOM ");
      this.updateUI(StepQueue.pop());
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
    // There is no concept of laststep
    // const lastStepElements = this.selectSteps(
    //   this.lastStep?.stepNumber as number,
    //   step.totalSteps
    // );

    // const currentStepElements = this.selectSteps(
    //   step.stepNumber,
    //   step.totalSteps
    // );
    let currentStepElts: HTMLDivElement[] = [];
    let lastStepElements: HTMLDivElement[] = [];
    // look for a subdivision through all unique stepper key
    if (!this.pulses?.hasLeads) {
      console.error("NO PULSES");
      return;
    }
    // TODO USE PULSES
    for (const pulse of this.pulses.getLeadPulses()) {
      // Could pulses each calculate their own
      // UPDATE EACH LEAD PULSE STEPPER FIRST
      // UPDATE THE CHILDREN OF LEAD STEPPERS
      const currentStep = pulse.getCurrentStep(step);
      const lastStep = pulse.getPrevStep(step);
      currentStepElts = this.selectSteps(step.stepNumber, step.totalSteps);
      lastStepElements = this.selectSteps(lastStep, step.totalSteps);
      console.log("[UPDATE UI] ", pulse);
      console.log("[UPDATE UI] currentStep ", currentStep, currentStepElts);
      console.log("[UPDATE UI] lastStep ", lastStep, lastStepElements);
    }
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
    if (lastStepElements.length && currentStepElts) {
      currentStepElts.forEach((elt, i) => {
        elt.dataset.ticking = "on";
        if (lastStepElements[i]) {
          lastStepElements[i].dataset.ticking = "off";
        } // unhighlight the last ticking step if there was one
      });
      // if (lastStepElements.length && currentStepElements) {
      //   currentStepElements.forEach((elt, i) => {
      //     elt.dataset.ticking = "on";
      //     if (lastStepElements[i]) {
      //       lastStepElements[i].dataset.ticking = "off";
      //     } // unhighlight the last ticking step if there was one
      //   });
    }
  }
}

export default UI;
