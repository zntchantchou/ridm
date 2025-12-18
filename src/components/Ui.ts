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
    // console.log("[UI start]");
    this.isPlaying = true;
    this.animationId = requestAnimationFrame(this.draw);
  }

  /** pause the animation */
  pause() {
    // console.log("[UI pause]");
    this.isPlaying = false;
    // cancel animation frame
  }

  /** stop the animation */
  stop() {
    // console.log("[UI stop]");
    this.isPlaying = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  draw = () => {
    // console.log("[UI draw]");
    if (!this.audioContext) return;
    const currentTime = this.audioContext.currentTime;
    while (StepQueue.size() && StepQueue.head().time < currentTime) {
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
    let currentStepElts: HTMLDivElement[] = [];
    let lastStepElements: HTMLDivElement[] = [];
    // look for a subdivision through all unique stepper key
    if (!this.pulses?.hasLeads) {
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
      pulse.subs.forEach((sub) => {
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
