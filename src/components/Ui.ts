import Pulses from "./Pulses";
// import Sequencer from "./Sequencer";
import StepQueue, { type Step } from "./StepQueue";
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

  private updateUI(step: Step) {
    let currentStepElts: HTMLDivElement[] = [];
    let lastStepElements: HTMLDivElement[] = [];
    if (!this.pulses?.getLeadPulses().length) {
      console.error("NO PULSES");
      return;
    }
    // highlight steps from parent pulses
    currentStepElts = this.selectSteps(step.stepNumber, step.totalSteps);
    lastStepElements = this.selectSteps(
      step.stepNumber === 0 ? step.totalSteps - 1 : step.stepNumber - 1, // unstyle last element if step is 0
      step.totalSteps
    );
    // highlight steps from children pulses (subdivisions)
    for (const pulse of this.pulses.getLeadPulses()) {
      pulse.getSubs()?.forEach((sub) => {
        const prevStep = this.selectSteps(sub.getPrevStep(step), sub.steps);
        const currStep = this.selectSteps(sub.getCurrentStep(step), sub.steps);
        lastStepElements.push(...prevStep);
        currentStepElts.push(...currStep);
      });
    }

    if (lastStepElements.length && currentStepElts) {
      currentStepElts.forEach((elt, i) => {
        elt.dataset.ticking = "on";
        if (lastStepElements[i]) {
          lastStepElements[i].dataset.ticking = "off"; // unhighlight the last ticking step if there was one
        }
      });
    }
  }
}

export default UI;
