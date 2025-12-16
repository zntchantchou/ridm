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
    console.log("[UI start]", this.audioContext);
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
    console.log("[UI draw]");
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

  private updateUI(step: Step) {
    // select all concerned steppers
    // list their children
    console.log("UPDATE UI");
    const lastStepElements: NodeListOf<HTMLDivElement> =
      document.querySelectorAll(
        `[data-steps="${step.totalSteps}"][data-step="${this.lastStep?.stepNumber}"]`
      );
    const currentStepElements: NodeListOf<HTMLDivElement> =
      document.querySelectorAll(
        `[data-steps="${step.totalSteps}"][data-step="${step.stepNumber}"]`
      );
    // console.log("Last step ", this.lastStep);
    // console.log("CurrentStep ", step);
    console.log("lastStepElts ", lastStepElements);
    console.log("currentStepElts ", currentStepElements);
    if (lastStepElements.length && currentStepElements) {
      currentStepElements.forEach((elt, i) => {
        elt.dataset.ticking = "on";
        console.log("ELT ", elt);
        if (lastStepElements[i]) {
          lastStepElements[i].dataset.ticking = "off";
          console.log("lastStepElt AT BUG ", lastStepElements[i]);
        } // unhighlight the last ticking step if there was one
      });
    }
  }
}

export default UI;
