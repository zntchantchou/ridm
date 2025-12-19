import { beforeEach, describe, expect, it } from "vitest";
import Pulses from "./Pulses.ts";
import Stepper from "./Stepper.ts";

describe("Pulses.register()", () => {
  let pulses: Pulses;
  let steppers: Stepper[];

  beforeEach(() => {
    pulses = new Pulses();
    steppers = [];

    document.body.innerHTML = '<div id="steppers"></div>';
  });

  it("1. registers stepper to empty Pulses correctly", () => {
    const stepper16 = new Stepper({ beats: 4, stepsPerBeat: 4 });
    steppers.push(stepper16);

    pulses.register(stepper16, steppers);

    expect(pulses.size).toBe(1);
    expect(pulses.isEmpty).toBe(false);
    expect(pulses.hasLeads()).toBe(true);
    expect(pulses.getLeadPulses().length).toBe(1);
    expect(pulses.getLeadPulses()[0].steps).toBe(16);
    expect(pulses.getLeadPulses()[0].count).toBe(1);
    expect(stepper16.pulseSubscription).not.toBeNull();
  });

  it("2. registers stepper to existing pulse with same steps", () => {
    const stepper16a = new Stepper({ beats: 4, stepsPerBeat: 4 });
    const stepper16b = new Stepper({ beats: 4, stepsPerBeat: 4 });
    steppers.push(stepper16a, stepper16b);

    pulses.register(stepper16a, steppers);
    pulses.register(stepper16b, steppers);

    expect(pulses.size).toBe(1);
    expect(pulses.getLeadPulses().length).toBe(1);
    const pulse = pulses.getLeadPulses()[0];
    expect(pulse.steps).toBe(16);
    expect(pulse.count).toBe(2);
    expect(stepper16a.pulseSubscription).not.toBeNull();
    expect(stepper16b.pulseSubscription).not.toBeNull();
    // expect(stepper16b.pulseSubscription?.closed).toBe(false);
  });

  it("3. registers child pulse when parent exists", () => {
    const stepper16 = new Stepper({ beats: 4, stepsPerBeat: 4 });
    const stepper8 = new Stepper({ beats: 4, stepsPerBeat: 2 });
    steppers.push(stepper16, stepper8);

    pulses.register(stepper16, steppers);
    pulses.register(stepper8, steppers);

    expect(pulses.size).toBe(2);
    expect(pulses.getLeadPulses().length).toBe(1);
    expect(pulses.getLeadPulses()[0].steps).toBe(16);

    const parentPulse = pulses.getLeadPulses()[0];
    expect(parentPulse.subs.length).toBe(1);
    expect(parentPulse.subs[0].steps).toBe(8);
    expect(stepper8.pulseSubscription).not.toBeNull();
  });

  it("4. registers parent pulse when child exists and reassigns subs", () => {
    const stepper8 = new Stepper({ beats: 4, stepsPerBeat: 2 });
    const stepper16 = new Stepper({ beats: 4, stepsPerBeat: 4 });
    steppers.push(stepper8, stepper16);

    pulses.register(stepper8, steppers);
    expect(pulses.getLeadPulses()[0].steps).toBe(8);

    pulses.register(stepper16, steppers);

    expect(pulses.size).toBe(2);
    expect(pulses.getLeadPulses().length).toBe(1);
    expect(pulses.getLeadPulses()[0].steps).toBe(16);

    const parentPulse = pulses.getLeadPulses()[0];
    expect(parentPulse.subs.length).toBe(1);
    expect(parentPulse.subs[0].steps).toBe(8);
    expect(parentPulse.subs[0].count).toBe(1);
    expect(stepper16.pulseSubscription).not.toBeNull();
  });

  it("5. registers many unrelated pulses correctly", () => {
    const stepper3 = new Stepper({ beats: 3, stepsPerBeat: 1 });
    const stepper5 = new Stepper({ beats: 5, stepsPerBeat: 1 });
    const stepper7 = new Stepper({ beats: 7, stepsPerBeat: 1 });
    steppers.push(stepper3, stepper5, stepper7);

    pulses.register(stepper3, steppers);
    pulses.register(stepper5, steppers);
    pulses.register(stepper7, steppers);

    expect(pulses.size).toBe(3);
    expect(pulses.getLeadPulses().length).toBe(3);

    const leadSteps = pulses.getLeadPulses().map((p) => p.steps);
    expect(leadSteps).toContain(3);
    expect(leadSteps).toContain(5);
    expect(leadSteps).toContain(7);

    pulses.getLeadPulses().forEach((pulse) => {
      expect(pulse.subs.length).toBe(0);
    });
  });

  it("6. maintains leadPulses sorted descending by steps", () => {
    const stepper4 = new Stepper({ beats: 4, stepsPerBeat: 1 });
    const stepper16 = new Stepper({ beats: 4, stepsPerBeat: 4 });
    const stepper8 = new Stepper({ beats: 4, stepsPerBeat: 2 });
    const stepper12 = new Stepper({ beats: 3, stepsPerBeat: 4 });
    steppers.push(stepper4, stepper16, stepper8, stepper12);

    pulses.register(stepper4, steppers);
    pulses.register(stepper16, steppers);
    pulses.register(stepper12, steppers);

    expect(pulses.getLeadPulses().length).toBe(2);
    const leadSteps = pulses.getLeadPulses().map((p) => p.steps);
    expect(leadSteps[0]).toBeGreaterThan(leadSteps[1]);
    expect(leadSteps).toEqual([16, 12]);
  });

  it("7. updates pulse count when registering to existing pulse", () => {
    const stepper16a = new Stepper({ beats: 4, stepsPerBeat: 4 });
    const stepper16b = new Stepper({ beats: 4, stepsPerBeat: 4 });
    const stepper16c = new Stepper({ beats: 4, stepsPerBeat: 4 });
    steppers.push(stepper16a, stepper16b, stepper16c);

    pulses.register(stepper16a, steppers);
    expect(pulses.getLeadPulses()[0].count).toBe(1);

    pulses.register(stepper16b, steppers);
    expect(pulses.getLeadPulses()[0].count).toBe(2);

    pulses.register(stepper16c, steppers);
    expect(pulses.getLeadPulses()[0].count).toBe(3);
  });

  it("8. reassigns steppers to new parent when parent pulse added", () => {
    const stepper4 = new Stepper({ beats: 4, stepsPerBeat: 1 });
    const stepper8 = new Stepper({ beats: 4, stepsPerBeat: 2 });
    const stepper16 = new Stepper({ beats: 4, stepsPerBeat: 4 });
    steppers.push(stepper4, stepper8, stepper16);

    pulses.register(stepper8, steppers);
    const pulse8FirstSubscription = stepper8.pulseSubscription;

    pulses.register(stepper4, steppers);
    const pulse4FirstSubscription = stepper4.pulseSubscription;

    expect(pulses.getLeadPulses()[0].steps).toBe(8);
    expect(pulses.getLeadPulses()[0].subs[0].steps).toBe(4);

    pulses.register(stepper16, steppers);

    expect(pulses.getLeadPulses().length).toBe(1);
    expect(pulses.getLeadPulses()[0].steps).toBe(16);
    expect(pulses.getLeadPulses()[0].subs.length).toBe(2);

    const subsSteps = pulses
      .getLeadPulses()[0]
      .subs.map((s) => s.steps)
      .sort((a, b) => b - a);
    expect(subsSteps).toEqual([8, 4]);

    expect(stepper8.pulseSubscription).not.toBe(pulse8FirstSubscription);
    expect(stepper4.pulseSubscription).not.toBe(pulse4FirstSubscription);
    expect(stepper16.pulseSubscription).not.toBeNull();
  });
});
