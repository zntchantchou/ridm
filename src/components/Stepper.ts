const steppersDiv = document.getElementById("steppers");

interface StepperOptions {
  beats: number;
  stepsPerBeat: number;
}

class Stepper {
  // Total number of steps for the row
  // If a bigger multiple of 16 is present , consider biggerStepper / stepper to be the filteringRatio
  beats = 4;
  stepsPerBeat = 4;
  lastStep = -1;
  currentStep = 0;
  stepPickupRatio = 0;
  stepElements: HTMLDivElement[] = [];
  element: HTMLDivElement | null = null;
  // Stepper should monitor which beats are selected
  // Each pulsation, a Pulse needs to quickly know if / which sounds to play for the current stepnumber
  constructor({ beats, stepsPerBeat }: StepperOptions) {
    this.beats = beats;
    this.stepsPerBeat = stepsPerBeat;
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
        if (i % this.stepsPerBeat === 0) element.classList.add("beat");
        return element;
      });
    const stepper = document.createElement("div");
    stepper.classList.add("stepper");
    steppersDiv?.appendChild(stepper);
    for (const item of this.stepElements) {
      stepper.appendChild(item);
    }
    this.element = stepper;
    this.element.addEventListener("click", this.handleClick);
  }

  handleClick = (e: Event) => {
    console.log("Stepper clicked", e);
  };
  
  get steps() {
    return this.stepsPerBeat * this.beats;
  }
// Because the "on" or "off" are common to all steppers in the same pulse, it is handle by UI.
// The selected state is unique to the stepper
// Each pulse, the stepper should be notified and if the corresponding step is selected, trigger the sound at nextNoteTime
// Also each stepper should have a sound

}

export default Stepper;
