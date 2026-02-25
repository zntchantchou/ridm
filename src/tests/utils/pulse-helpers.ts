import { expect } from "vitest";
import { PulseClass } from "../../modules/Pulses.ts";
import type StepperMock from "../mocks/Stepper.mock.ts";

export function expectPulseCount(
  pulses: InstanceType<typeof PulseClass>,
  expectedCount: number
): void {
  expect(pulses.getAllPulses().length).toBe(expectedCount);
}

export function expectLeadPulseCount(
  pulses: InstanceType<typeof PulseClass>,
  expectedCount: number
): void {
  expect(pulses.getLeadPulses().length).toBe(expectedCount);
}

export function expectPulseSteps(
  pulses: InstanceType<typeof PulseClass>,
  steps: number,
  expectedCount: number
): void {
  const pulse = pulses.getPulse(steps);
  expect(pulse).toBeDefined();
  expect(pulse?.count).toBe(expectedCount);
}

export function expectLeadPulseSteps(
  pulses: InstanceType<typeof PulseClass>,
  expectedSteps: number[]
): void {
  const actualSteps = pulses.getLeadPulses().map((p) => p.steps);
  expect(actualSteps).toEqual(expectedSteps);
}

export function expectStepperSubscribed(stepper: StepperMock): void {
  expect(stepper.pulseSubscription).not.toBeNull();
  expect(stepper.pulseSubscription?.closed).toBe(false);
}

export function expectStepperUnsubscribed(stepper: StepperMock): void {
  expect(stepper.pulseSubscription?.closed).toBe(true);
}

export function getLeadPulseSteps(
  pulses: InstanceType<typeof PulseClass>
): number[] {
  return pulses.getLeadPulses().map((p) => p.steps);
}

export function expectPulsesInSync(
  pulses: InstanceType<typeof PulseClass>
): void {
  const leadCount = pulses.getLeadPulses().length;
  const leadInElements = pulses.getAllPulses().filter((p) => p.lead).length;
  expect(leadInElements).toBe(leadCount);

  pulses.getLeadPulses().forEach((leadPulse) => {
    expect(pulses.getAllPulses().includes(leadPulse)).toBe(true);
  });
}
