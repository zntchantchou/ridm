import { filter, Subscription } from "rxjs";
import type Pulse from "./Pulse";
import Audio from "./Audio";
import StepperControls from "./StepperControls";

const steppersDiv = document.getElementById("steppers");

export interface StepperOptions {
  beats: number;
  stepsPerBeat: number;
  id: number;
}

class Stepper {
  // Total number of steps for the row
  // If a bigger multiple of 16 is present , consider biggerStepper / stepper to be the filteringRatio
  id?: number;
  beats = 4;
  stepsPerBeat = 4;
  lastStep = -1;
  currentStep = 0;
  stepPickupRatio = 0;
  stepElements: HTMLDivElement[] = [];
  element: HTMLDivElement | null = null;
  pulseSubscription: Subscription | null = null;
  selectedSteps: boolean[] = Array(this.beats * this.stepsPerBeat).fill(false);
  controls: StepperControls | null = null;

  // Stepper should monitor which beats are selected
  // Each pulsation, a Pulse needs to quickly know if / which sounds to play for the current stepnumber
  constructor({ beats, stepsPerBeat, id }: StepperOptions) {
    this.beats = beats;
    this.stepsPerBeat = stepsPerBeat;
    this.id = id;
    this.controls = new StepperControls({
      stepperId: this.id,
      beats: this.beats,
      stepsPerBeats: this.stepsPerBeat,
    });
    this.renderUi();
  }

  listenToPulse(pulse: Pulse) {
    this.pulseSubscription?.unsubscribe(); // cancel any previous subscription
    this.pulseSubscription = pulse.currentStepSubject
      .pipe(
        filter(({ stepNumber, totalSteps }) =>
          this.filterStep({ totalSteps, stepNumber })
        )
      ) // Only trigger if note is selected
      .subscribe({
        next: ({ stepNumber, time }) => {
          console.log("[STEPPER]: PLAYING! ", time, stepNumber);
          Audio.playDefault(time);
        },
        complete: () => {
          console.log("[STEPPER] PULSE HAS COMPLETED");
        },
        // error handling, complete behaviour?
      });
  }

  filterStep({
    totalSteps,
    stepNumber,
  }: {
    totalSteps: number;
    stepNumber: number;
  }) {
    if (totalSteps === this.steps) return !!this.selectedSteps[stepNumber];
    const parentChildRatio = totalSteps / this.steps;
    const actualStep = stepNumber / parentChildRatio;
    // console.log("actualStep ", actualStep);
    return Number.isInteger(actualStep) && !!this.selectedSteps[actualStep];
  }
  stop() {
    this.pulseSubscription?.unsubscribe();
  }

  updateUi() {
    if (!this.element?.hasChildNodes()) return;
    for (const child of this.stepElements) {
      console.log("CHILD ", child);
      this.element.removeChild(child);
    }
    this.createStepElements();
    for (const item of this.stepElements) {
      this.element.appendChild(item);
    }
  }

  renderUi() {
    this.createStepElements();
    const stepper = document.createElement("div");
    stepper.classList.add("stepper");
    steppersDiv?.appendChild(stepper);
    for (const item of this.stepElements) {
      stepper.appendChild(item);
    }
    if (!this.element) this.setupControls();
    this.element = stepper;
    this.element.addEventListener("click", this.handleClick);
    console.log("beatsInputElt", this.beatsInputElt);
  }

  setupControls() {
    this.controls?.render();
    this.beatsInputElt?.addEventListener("change", this.handleBeatsUpdate);
    this.stepsPerBeatsInputElt?.addEventListener(
      "change",
      this.handleStepsPerBeatUpdate
    );
  }

  handleClick = (e: Event) => {
    const target = e.target as HTMLDivElement;
    const step = target.dataset.step;
    if (!step) return;
    // OTher guardrails here? runtime type check?
    this.toggleStep(parseInt(step));
  };

  private toggleStep(stepNumber: number) {
    const currentValue = this.selectedSteps[stepNumber];
    this.selectedSteps[stepNumber] = !currentValue;
    const step = this.stepElements[stepNumber];
    step.dataset.selected = currentValue ? "off" : "on"; // turn on or off
  }

  handleBeatsUpdate = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value);
    if (value) this.beats = value;
    console.log("[handleBeatsUpdate]", target.value);
    this.updateUi();
  };

  handleStepsPerBeatUpdate = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value);
    if (value) this.stepsPerBeat = value;
    console.log("[handleStepsPerBeatUpdate]", target.value);
    this.updateUi();
  };

  createStepElements() {
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
  }

  private get beatsInputElt() {
    return document.querySelector(
      `input[name=beats][data-stepper-id="${this.id}"]`
    );
  }

  private get stepsPerBeatsInputElt() {
    return document.querySelector(
      `input[name=steps-per-beat][data-stepper-id="${this.id}"]`
    );
  }

  get steps() {
    return this.stepsPerBeat * this.beats;
  }
}

export default Stepper;
