import { beforeEach, describe, expect, it } from "vitest";
import { PulseClass } from "../modules/Pulses.ts";
import {
  createStepper,
  createStepperWithSteps,
  expectPulseCount,
  expectLeadPulseCount,
  expectLeadPulseSteps,
  expectStepperSubscribed,
  setupMinimalDOM,
} from "./utils/index.ts";

describe("Pulses.register()", () => {
  let pulses: InstanceType<typeof PulseClass>;

  beforeEach(() => {
    pulses = new PulseClass();
    setupMinimalDOM();
  });

  it("1. registers stepper to empty Pulses correctly", () => {
    const stepper16 = createStepper({ beats: 4, stepsPerBeat: 4, id: 1 });

    pulses.register(stepper16);

    expectPulseCount(pulses, 1);
    expectLeadPulseCount(pulses, 1);
    expectLeadPulseSteps(pulses, [16]);
    expect(pulses.getLeadPulses()[0].count).toBe(1);
    expectStepperSubscribed(stepper16);
  });

  it("2. registers stepper to existing pulse with same steps", () => {
    const stepper16a = createStepper({ beats: 4, stepsPerBeat: 4, id: 1 });
    const stepper16b = createStepper({ beats: 4, stepsPerBeat: 4, id: 2 });

    pulses.register(stepper16a);
    pulses.register(stepper16b);

    expectPulseCount(pulses, 1);
    expectLeadPulseCount(pulses, 1);
    const pulse = pulses.getLeadPulses()[0];
    expect(pulse.steps).toBe(16);
    expect(pulse.count).toBe(2);
    expectStepperSubscribed(stepper16a);
    expectStepperSubscribed(stepper16b);
  });

  it("3. registers child pulse when parent exists", () => {
    const stepper16 = createStepper({ beats: 4, stepsPerBeat: 4, id: 1 });
    const stepper8 = createStepper({ beats: 4, stepsPerBeat: 2, id: 2 });

    pulses.register(stepper16);
    pulses.register(stepper8);

    expectPulseCount(pulses, 2);
    expectLeadPulseCount(pulses, 1);
    expectLeadPulseSteps(pulses, [16]);

    const parentPulse = pulses.getLeadPulses()[0];
    expect(parentPulse.getSubs()?.length).toBe(1);
    expect(parentPulse.getSubs()?.[0].steps).toBe(8);
    expectStepperSubscribed(stepper8);
  });

  it("4. registers parent pulse when child exists and reassigns subs", () => {
    const stepper8 = createStepper({ beats: 4, stepsPerBeat: 2, id: 2 });
    const stepper16 = createStepper({ beats: 4, stepsPerBeat: 4, id: 1 });

    pulses.register(stepper8);
    expectLeadPulseSteps(pulses, [8]);

    pulses.register(stepper16);

    expectPulseCount(pulses, 2);
    expectLeadPulseCount(pulses, 1);
    expectLeadPulseSteps(pulses, [16]);

    const parentPulse = pulses.getLeadPulses()[0];
    expect(parentPulse.getSubs()?.length).toBe(1);
    expect(parentPulse.getSubs()?.[0].steps).toBe(8);
    expect(parentPulse.getSubs()?.[0].count).toBe(1);
    expectStepperSubscribed(stepper16);
  });

  it("5. registers many unrelated pulses correctly", () => {
    const stepper3 = createStepperWithSteps(3, { id: 1 });
    const stepper5 = createStepperWithSteps(5, { id: 2 });
    const stepper7 = createStepperWithSteps(7, { id: 3 });

    pulses.register(stepper3);
    pulses.register(stepper5);
    pulses.register(stepper7);

    expectPulseCount(pulses, 3);
    expectLeadPulseCount(pulses, 3);

    const leadSteps = pulses.getLeadPulses().map((p) => p.steps);
    expect(leadSteps).toContain(3);
    expect(leadSteps).toContain(5);
    expect(leadSteps).toContain(7);

    pulses.getLeadPulses().forEach((pulse) => {
      expect(pulse.getSubs()?.length || 0).toBe(0);
    });
  });

  it("6. maintains leadPulses sorted descending by steps", () => {
    const stepper4 = createStepper({ beats: 4, stepsPerBeat: 1, id: 1 });
    const stepper16 = createStepper({ beats: 4, stepsPerBeat: 4, id: 2 });
    const stepper12 = createStepper({ beats: 3, stepsPerBeat: 4, id: 4 });

    pulses.register(stepper4);
    pulses.register(stepper16);
    pulses.register(stepper12);

    expectLeadPulseCount(pulses, 2);
    const leadSteps = pulses.getLeadPulses().map((p) => p.steps);
    expect(leadSteps[0]).toBeGreaterThan(leadSteps[1]);
    expectLeadPulseSteps(pulses, [16, 12]);
  });

  it("7. updates pulse count when registering to existing pulse", () => {
    const stepper16a = createStepper({ beats: 4, stepsPerBeat: 4, id: 1 });
    const stepper16b = createStepper({ beats: 4, stepsPerBeat: 4, id: 2 });
    const stepper16c = createStepper({ beats: 4, stepsPerBeat: 4, id: 3 });

    pulses.register(stepper16a);
    expect(pulses.getLeadPulses()[0].count).toBe(1);

    pulses.register(stepper16b);
    expect(pulses.getLeadPulses()[0].count).toBe(2);

    pulses.register(stepper16c);
    expect(pulses.getLeadPulses()[0].count).toBe(3);
  });

  it("8. reassigns steppers to new parent when parent pulse added", () => {
    const stepper4 = createStepper({ beats: 4, stepsPerBeat: 1, id: 1 });
    const stepper8 = createStepper({ beats: 4, stepsPerBeat: 2, id: 2 });
    const stepper16 = createStepper({ beats: 4, stepsPerBeat: 4, id: 3 });

    pulses.register(stepper8);
    const pulse8FirstSubscription = stepper8.pulseSubscription;

    pulses.register(stepper4);
    const pulse4FirstSubscription = stepper4.pulseSubscription;

    expectLeadPulseSteps(pulses, [8]);
    expect(pulses.getLeadPulses()[0].getSubs()?.[0].steps).toBe(4);

    pulses.register(stepper16);
    const pulse16FirstSubscription = stepper16.pulseSubscription;

    expectLeadPulseCount(pulses, 1);
    const pulse16 = pulses.getLeadPulses()[0];
    expect(pulse16.steps).toBe(16);

    // Verify flat structure: pulse16 should have ALL descendants in its subs array
    expect(pulse16.getSubs()?.length).toBe(2);
    const subsSteps = pulse16
      .getSubs()
      ?.map((s) => s.steps)
      .sort((a, b) => b - a);
    expect(subsSteps).toEqual([8, 4]);

    // Verify pulse8 has no more children (they were flattened into pulse16's subs)
    const pulse8 = pulse16.getSubs()?.find((p) => p.steps === 8);
    const pulse4 = pulse16.getSubs()?.find((p) => p.steps === 4);
    expect(pulse8?.getSubs()?.length || 0).toBe(0);
    expect(pulse4?.getSubs()?.length || 0).toBe(0);

    // Verify ALL steppers listen to pulse16 (the lead pulse)
    expect(stepper8.pulseSubscription).not.toBe(pulse8FirstSubscription);
    expect(stepper8.pulseSubscription).toBeTruthy();
    expect(stepper4.pulseSubscription).not.toBe(pulse4FirstSubscription);
    expect(stepper4.pulseSubscription).toBeTruthy();
    expect(stepper16.pulseSubscription).toBe(pulse16FirstSubscription);
  });
});
