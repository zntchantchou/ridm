const steppersDiv = document.getElementById("steppers");

interface StepperOptions {
  steps: number;
}

class Stepper {
  // Total number of steps for the row
  // If a bigger multiple of 16 is present , consider biggerStepper / stepper to be the filteringRatio
  steps = 16;
  lastStep = -1;
  currentStep = 0;
  stepPickupRatio = 0;
  stepElements: HTMLDivElement[] = [];

  constructor(options: StepperOptions) {
    if (options && options.steps) this.steps = options.steps;
    this.render();
  }

  render() {
    // console.log("[stepper] RENDER");
    this.stepElements = Array(this.steps)
      .fill(null)
      .map((_, i) => {
        const element = document.createElement("div");
        element.classList.add("step");
        element.style.width = `calc(100% / ${this.steps})`;
        element.dataset.step = i.toString();
        element.dataset.steps = this.steps.toString();
        if (i === 0) element.classList.add("beat");
        return element;
      });
    const stepper = document.createElement("div");
    stepper.classList.add("stepper");
    steppersDiv?.appendChild(stepper);
    for (const item of this.stepElements) {
      stepper.appendChild(item);
    }
  }
}

export default Stepper;
