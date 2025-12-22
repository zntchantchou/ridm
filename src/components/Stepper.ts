import { filter, Subscription } from "rxjs";
import type Pulse from "./Pulse";
import Audio from "./Audio";
import StepperControls from "./StepperControls";
import Controls from "./Controls";

const steppersDiv = document.getElementById("steppers");

export interface StepperOptions {
  beats: number;
  stepsPerBeat: number;
  id: number;
  sampleName: string;
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
  /** e.g. "hh" */
  sampleName: string;

  // Stepper should monitor which beats are selected
  // Each pulsation, a Pulse needs to quickly know if / which sounds to play for the current stepnumber
  constructor({ beats, stepsPerBeat, id, sampleName }: StepperOptions) {
    this.beats = beats;
    this.stepsPerBeat = stepsPerBeat;
    this.id = id;
    this.sampleName = sampleName;
    this.controls = new StepperControls({
      stepperId: this.id,
      beats: this.beats,
      stepsPerBeats: this.stepsPerBeat,
      name: sampleName,
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
        next: ({ time }) => {
          console.log("TIME AT PLAY ", time);
          Audio.playDefaultSample(this.sampleName, time);
        },
        complete: () => {
          // error handling, complete behaviour?
          console.log("[STEPPER] PULSE HAS COMPLETED");
        },
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

  updateSelectedSteps(targetSize: number) {
    const selectedSteps = this.getSelectedBeatAsNumber();
    const ratio = targetSize / this.steps;
    const updatedSteps = [];
    for (const step of selectedSteps) {
      if (step === 0) {
        updatedSteps.push(0);
        continue;
      }
      const nextSelectedStep = Math.floor(step * ratio);
      if (nextSelectedStep < 1) continue;
      updatedSteps.push(nextSelectedStep);
    }
    this.selectedSteps = this.convertNumbersToSteps(targetSize, updatedSteps);
  }

  updateBeats(beats: number) {
    this.pulseSubscription?.unsubscribe();
    this.updateSelectedSteps(this.stepsPerBeat * beats);
    this.beats = beats;
    this.updateUi();
  }

  updateStepsPerBeat(spb: number) {
    this.pulseSubscription?.unsubscribe();
    this.updateSelectedSteps(this.beats * spb);
    this.stepsPerBeat = spb;
    this.updateUi();
  }

  convertNumbersToSteps(targetSize: number, numbers: number[]) {
    // console.log("[convertNumbersToSteps] NUMBERS EMPTY !");
    if (!numbers.length) return [];
    const steps: boolean[] = Array(targetSize)
      .fill(false)
      .map((_, i) => {
        return numbers.includes(i);
      });
    // console.log("[convertNumbersToSteps] STEPS ", steps, numbers);
    return steps;
  }

  getSelectedBeatAsNumber() {
    const selectedIndexes = [];
    for (const [index, selectedStep] of this.selectedSteps.entries()) {
      if (selectedStep) selectedIndexes.push(index);
    }
    return selectedIndexes;
  }

  updateUi() {
    if (!this.element?.hasChildNodes()) return;
    for (const child of this.stepElements) {
      this.element.removeChild(child);
    }
    this.createStepElements();
    for (const item of this.stepElements) {
      this.element.appendChild(item);
    }
  }

  private renderUi() {
    this.createStepElements();
    const stepper = document.createElement("div");
    stepper.classList.add("stepper");
    steppersDiv?.appendChild(stepper);
    for (const item of this.stepElements) {
      stepper.appendChild(item);
    }
    if (!this.element) this.controls?.render();
    this.element = stepper;
    this.element.addEventListener("click", this.handleClick);
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

  createStepElements() {
    this.stepElements = Array(this.steps)
      .fill(null)
      .map((_, i) => {
        const element = document.createElement("div");
        element.classList.add("step");
        element.style.width = `calc(100% / ${this.steps})`;
        element.dataset.step = i.toString();
        element.dataset.steps = this.steps.toString();
        element.dataset.selected = this.selectedSteps[i] ? "on" : "off";
        element.dataset.stepperId = this.id?.toString();
        if (i % this.stepsPerBeat === 0) element.classList.add("beat");
        return element;
      });
  }

  get steps() {
    return this.stepsPerBeat * this.beats;
  }
}

export default Stepper;
