import { filter, Subscription } from "rxjs";
import type Pulse from "./Pulse";

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
  pulseSubscription: Subscription | null = null;
  selectedSteps: boolean[] = Array(this.beats * this.stepsPerBeat).fill(false);

  // Stepper should monitor which beats are selected
  // Each pulsation, a Pulse needs to quickly know if / which sounds to play for the current stepnumber
  constructor({ beats, stepsPerBeat }: StepperOptions) {
    this.beats = beats;
    this.stepsPerBeat = stepsPerBeat;
    this.render();
  }

  listenToPulse(pulse: Pulse) {
    this.pulseSubscription = pulse.currentStepSubject
      // .pipe(filter((value) => !!this.selectedSteps[value] )) // filter if the note is selected or not
      // .pipe(filter((value) => value % 2 === 0)) // filter if the note is selected or not
      .subscribe({
        next: (value: number) => {
          console.log("[STEPPER]: ListenToPulse ! ", value);
        },
      });
  }

  stop() {
    // unsubscribe
    this.pulseSubscription?.unsubscribe();
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
        element.dataset.selected = "off";
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
    const target = e.target as HTMLDivElement;
    console.log("Stepper clicked TARGET", target.dataset.step);
    const step = target.dataset.step;
    if (!step) return;
    // OTher guardrails here? runtime type check?
    console.log("STEP ", step);
    this.toggleStep(parseInt(step));
  };

  get steps() {
    return this.stepsPerBeat * this.beats;
  }

  private toggleStep(stepNumber: number) {
    const currentValue = this.selectedSteps[stepNumber];
    this.selectedSteps[stepNumber] = !currentValue;
    const step = this.stepElements[stepNumber];
    step.dataset.selected = currentValue ? "off" : "on"; // turn on or off
    // update the style of the element to active or inactive
    console.log("TOGGLED", this.selectedSteps);
    // Because the "on" or "off" are common to all steppers in the same pulse, it is handle by UI.
    // The selected state is unique to the stepper
    // Each pulse, the stepper should be notified and if the corresponding step is selected, trigger the sound at nextNoteTime
    // Also each stepper should have a sound
  }
}

export default Stepper;
