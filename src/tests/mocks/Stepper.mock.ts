import type { Subscription } from "rxjs";
import type { StepperIdType } from "../../state/state.types";
import type Pulse from "../../modules/Pulse";

export type StepperColorType = { name: string; cssColor: string };

export interface StepperOptions {
  beats: number;
  stepsPerBeat: number;
  id: StepperIdType;
  sampleName: string;
  color: StepperColorType;
  selectedSteps?: boolean[];
}

/**
 * Mock Stepper class for testing purposes.
 * This is a simplified version of the original class-based Stepper
 * that was replaced by the Lit component implementation.
 */
export class StepperMock {
  id?: StepperIdType;
  beats = 4;
  stepsPerBeat = 4;
  pulseSubscription: Subscription | null = null;
  selectedSteps: boolean[];
  sampleName: string;
  color: StepperColorType | null = null;

  constructor({
    beats,
    stepsPerBeat,
    id,
    sampleName,
    color,
    selectedSteps,
  }: StepperOptions) {
    this.beats = beats;
    this.stepsPerBeat = stepsPerBeat;
    this.id = id;
    this.sampleName = sampleName;
    this.color = color;
    this.selectedSteps = selectedSteps || Array(this.steps).fill(false);
  }

  get steps(): number {
    return this.beats * this.stepsPerBeat;
  }

  listenToPulse(pulse: Pulse): void {
    if (this.pulseSubscription) {
      this.pulseSubscription.unsubscribe();
    }
    this.pulseSubscription = pulse.currentStepSubject.subscribe(() => {
      // Mock implementation - just subscribe without doing anything
    });
  }

  async updateSteps({
    beats,
    stepsPerBeat,
  }: {
    beats?: number;
    stepsPerBeat?: number;
  }): Promise<void> {
    if (beats) this.beats = beats;
    if (stepsPerBeat) this.stepsPerBeat = stepsPerBeat;
    this.updateSelectedSteps(this.steps);
  }

  private updateSelectedSteps(targetSize: number): void {
    const selectedSteps = this.getSelectedBeatAsNumber();
    const ratio = targetSize / this.selectedSteps.length;
    const updatedSteps = [];
    for (const step of selectedSteps) {
      if (step === 0) {
        updatedSteps.push(step);
        continue;
      }
      const nextSelectedStep = Math.floor(step * ratio);
      if (nextSelectedStep < 1) continue;
      updatedSteps.push(nextSelectedStep);
    }
    this.selectedSteps = this.convertNumbersToSteps(targetSize, updatedSteps);
  }

  private convertNumbersToSteps(targetSize: number, numbers: number[]): boolean[] {
    if (!numbers.length) return Array(targetSize).fill(false);
    const steps: boolean[] = Array(targetSize)
      .fill(false)
      .map((_, i) => numbers.includes(i));
    return steps;
  }

  private getSelectedBeatAsNumber(): number[] {
    const selectedIndexes = [];
    for (const [index, selectedStep] of this.selectedSteps.entries()) {
      if (selectedStep) selectedIndexes.push(index);
    }
    return selectedIndexes;
  }
}

export default StepperMock;
