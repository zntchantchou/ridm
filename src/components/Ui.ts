import Pulses from "../modules/Pulses";
import StepQueue, { type Step } from "../modules/StepQueue";
import * as Tone from "tone";

class UI {
  audioContext: null | Tone.Context;
  lastStep: Step | null = null;
  isPlaying = false;
  animationId: number | null = null;
  pulses: typeof Pulses | null = null;
  constructor(AC: Tone.Context, pulses: typeof Pulses) {
    this.audioContext = AC;
    this.pulses = pulses;
  }
  /** start the animation */
  start() {
    this.isPlaying = true;
    this.animationId = requestAnimationFrame(this.draw);
  }

  /** pause the animation */
  pause() {
    this.isPlaying = false;
  }

  /** stop the animation */
  stop() {
    this.isPlaying = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  draw = () => {
    if (!this.audioContext) return;
    const currentTime = this.audioContext.currentTime;
    while (StepQueue.size() && StepQueue.head().time < currentTime) {
      this.updateUI(StepQueue.pop());
    }
    if (this.isPlaying) requestAnimationFrame(this.draw);
  };

  private selectSteps(stepNumber: number, steps: number) {
    return Array.from(
      document.querySelectorAll(
        `[data-steps="${steps}"][data-step="${stepNumber}"]`
      )
    ) as HTMLDivElement[];
  }

  private selectPulseSteps(totalSteps: number) {
    return document.querySelectorAll(`.step[data-steps="${totalSteps}"]`);
  }
  private updateUI(step: Step) {
    let currentStepElts: HTMLDivElement[] = [];
    if (!this.pulses?.getLeadPulses().length) {
      console.error("NO PULSES");
      return;
    }
    // highlight steps from parent pulses
    currentStepElts = this.selectSteps(step.stepNumber, step.totalSteps);
    this.selectPulseSteps(step.totalSteps).forEach((s) => {
      (s as HTMLDivElement).dataset.ticking = "off";
    });
    // only one loop is necessary
    // for (const pulse of this.pulses.getLeadPulses()) {
    //   pulse.getSubs()?.forEach((sub) => {
    //     this.selectPulseSteps(sub.steps).forEach((s) => {
    //       (s as HTMLDivElement).dataset.ticking = "off";
    //     });
    //     const currentStep = sub.getCurrentStep(step);
    //     const currSteps = this.selectSteps(currentStep, sub.steps);
    //     currentStepElts.push(...currSteps);
    //   });
    // }

    if (currentStepElts) {
      currentStepElts.forEach((elt) => (elt.dataset.ticking = "on"));
    }
  }
}

export default UI;
