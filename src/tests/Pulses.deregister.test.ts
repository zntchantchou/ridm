import { beforeEach, describe, expect, it } from "vitest";
import { PulseClass } from "../modules/Pulses.ts";
import {
  createStepper,
  expectPulseCount,
  expectLeadPulseCount,
  expectLeadPulseSteps,
  expectStepperSubscribed,
  expectPulsesInSync,
  setupDOM,
} from "./utils/index.ts";

describe("Pulses.deregister() - Stepper updates", () => {
  let pulses: InstanceType<typeof PulseClass>;

  beforeEach(() => {
    pulses = new PulseClass();
    setupDOM();
  });

  it("1. update stepper count on existing pulse decrements count", () => {
    const stepper16a = createStepper({ beats: 4, stepsPerBeat: 4, id: 0 });
    const stepper16b = createStepper({ beats: 4, stepsPerBeat: 4, id: 1 });

    pulses.register(stepper16a);
    pulses.register(stepper16b);

    expect(pulses.getLeadPulses()[0].count).toBe(2);

    pulses.deregister(stepper16a);

    expect(pulses.getLeadPulses()[0].count).toBe(1);
    expectPulseCount(pulses, 1);
  });

  it("2. pulse with count 1 is deleted when stepper deregisters", () => {
    const stepper16 = createStepper({ beats: 4, stepsPerBeat: 4, id: 0 });

    pulses.register(stepper16);

    expectPulseCount(pulses, 1);
    expect(pulses.getLeadPulses()[0].count).toBe(1);

    pulses.deregister(stepper16);

    expectPulseCount(pulses, 0);
    expectLeadPulseCount(pulses, 0);
  });

  it("3. pulse with count > 1 is kept when one stepper deregisters", () => {
    const stepper16a = createStepper({ beats: 4, stepsPerBeat: 4, id: 0 });
    const stepper16b = createStepper({ beats: 4, stepsPerBeat: 4, id: 1 });
    const stepper16c = createStepper({ beats: 4, stepsPerBeat: 4, id: 2 });

    pulses.register(stepper16a);
    pulses.register(stepper16b);
    pulses.register(stepper16c);

    expect(pulses.getLeadPulses()[0].count).toBe(3);

    pulses.deregister(stepper16a);

    expectPulseCount(pulses, 1);
    expect(pulses.getLeadPulses()[0].count).toBe(2);
    expectLeadPulseSteps(pulses, [16]);
  });

  it("4. lead pulse with no subs is deleted when last stepper deregisters", () => {
    const stepper12 = createStepper({ beats: 3, stepsPerBeat: 4, id: 0 });

    pulses.register(stepper12);

    expectPulseCount(pulses, 1);
    expect(pulses.getLeadPulses()[0].lead).toBe(true);
    expect(pulses.getLeadPulses()[0].getSubs()?.length || 0).toBe(0);

    pulses.deregister(stepper12);

    expectPulseCount(pulses, 0);
    expectLeadPulseCount(pulses, 0);
  });

  it("5. lead pulse with subs promotes first sub when deleted", () => {
    const stepper16 = createStepper({ beats: 4, stepsPerBeat: 4, id: 0 });
    const stepper8 = createStepper({ beats: 4, stepsPerBeat: 2, id: 1 });
    const stepper4 = createStepper({ beats: 4, stepsPerBeat: 1, id: 2 });

    pulses.register(stepper16);
    pulses.register(stepper8);
    pulses.register(stepper4);

    expectPulseCount(pulses, 3);
    expectLeadPulseCount(pulses, 1);
    expectLeadPulseSteps(pulses, [16]);
    expect(pulses.getLeadPulses()[0].getSubs()?.length).toBe(2);

    pulses.deregister(stepper16);

    expectPulseCount(pulses, 2);
    expectLeadPulseCount(pulses, 1);
    expectLeadPulseSteps(pulses, [8]);
    expect(pulses.getLeadPulses()[0].lead).toBe(true);
    expect(pulses.getLeadPulses()[0].getSubs()?.length).toBe(1);
    expect(pulses.getLeadPulses()[0].getSubs()?.[0].steps).toBe(4);
  });

  it("6. stepper unsubscribes from old pulse when updating", async () => {
    const stepper16 = createStepper({ beats: 4, stepsPerBeat: 4, id: 0 });

    pulses.register(stepper16);

    const originalSubscription = stepper16.pulseSubscription;
    expectStepperSubscribed(stepper16);

    pulses.deregister(stepper16);
    await stepper16.updateSteps({ beats: 3 });
    pulses.register(stepper16);

    expect(originalSubscription?.closed).toBe(true);
  });

  it("7. stepper subscribes to new pulse after update", async () => {
    const stepper16 = createStepper({ beats: 4, stepsPerBeat: 4, id: 0 });

    pulses.register(stepper16);

    const originalSubscription = stepper16.pulseSubscription;

    pulses.deregister(stepper16);
    await stepper16.updateSteps({ beats: 3 });
    pulses.register(stepper16);

    expectStepperSubscribed(stepper16);
    expect(stepper16.pulseSubscription).not.toBe(originalSubscription);
    expect(stepper16.steps).toBe(12);
    expectLeadPulseSteps(pulses, [12]);
  });

  it("8. updating stepper to existing pulse increments count", async () => {
    const stepper16 = createStepper({ beats: 4, stepsPerBeat: 4, id: 0 });
    const stepper12 = createStepper({ beats: 3, stepsPerBeat: 4, id: 1 });

    pulses.register(stepper16);
    pulses.register(stepper12);

    expectPulseCount(pulses, 2);
    expect(pulses.getPulse(16)?.count).toBe(1);

    pulses.deregister(stepper12);
    await stepper12.updateSteps({ beats: 4 });
    pulses.register(stepper12);

    expectPulseCount(pulses, 1);
    expectLeadPulseSteps(pulses, [16]);
    expect(pulses.getLeadPulses()[0].count).toBe(2);
  });

  it("9. rapid succession updates handled correctly (deregister-register cycle)", async () => {
    const stepper16a = createStepper({ beats: 4, stepsPerBeat: 4, id: 0 });
    const stepper16b = createStepper({ beats: 4, stepsPerBeat: 4, id: 1 });
    const stepper16c = createStepper({ beats: 4, stepsPerBeat: 4, id: 2 });

    pulses.register(stepper16a);
    pulses.register(stepper16b);
    pulses.register(stepper16c);

    expect(pulses.getLeadPulses()[0].count).toBe(3);

    const updates = [
      { stepper: stepper16a, beats: 3 },
      { stepper: stepper16b, beats: 2 },
      { stepper: stepper16c, beats: 5 },
    ];

    for (const { stepper, beats } of updates) {
      pulses.deregister(stepper);
      await stepper.updateSteps({ beats });
      pulses.register(stepper);
    }

    expectPulseCount(pulses, 3);
    const leadSteps = pulses
      .getLeadPulses()
      .map((p) => p.steps)
      .sort((a, b) => b - a);
    expect(leadSteps).toEqual([20, 12, 8]);
    pulses.getLeadPulses().forEach((pulse) => {
      expect(pulse.count).toBe(1);
    });
  });

  it("10. pulse elements and leadPulses arrays stay synchronized", () => {
    const stepper16 = createStepper({ beats: 4, stepsPerBeat: 4, id: 0 });
    const stepper8 = createStepper({ beats: 4, stepsPerBeat: 2, id: 1 });

    pulses.register(stepper16);
    pulses.register(stepper8);

    expectPulseCount(pulses, 2);
    expectLeadPulseCount(pulses, 1);
    expectPulsesInSync(pulses);

    pulses.deregister(stepper16);

    expectPulseCount(pulses, 1);
    expectLeadPulseCount(pulses, 1);
    expectLeadPulseSteps(pulses, [8]);
    expectPulsesInSync(pulses);
  });
});
