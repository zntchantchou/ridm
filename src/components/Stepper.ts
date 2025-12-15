const steppersDiv = document.getElementById("steppers");

interface StepperOptions {
  steps: number;
}

class Stepper {
  // Total number of steps for the row
  steps = 16;
  stepElements: HTMLDivElement[] = [];
  constructor(options: StepperOptions) {
    if (options && options.steps) this.steps = options.steps;
    this.render();
  }

  render() {
    console.log("[stepper] RENDER");
    this.stepElements = Array(this.steps)
      .fill(null)
      .map((_, i) => {
        const element = document.createElement("div");
        element.classList.add("step");
        element.style.width = `calc(100% / ${this.steps})`;
        element.dataset.beat = i.toString();
        if (i % 4 === 0) {
          element.classList.add("beat");
        }
        return element;
      });
    // console.log("Steps ", steps);
    const stepper = document.createElement("div");
    stepper.classList.add("stepper");
    steppersDiv?.appendChild(stepper);
    for (const item of this.stepElements) {
      stepper.appendChild(item);
      // console.log("added item", item);
    }
  }
}

export default Stepper;
