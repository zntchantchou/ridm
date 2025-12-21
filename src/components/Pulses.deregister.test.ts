import { beforeEach, describe, expect, it } from "vitest";
import Pulses from "./Pulses.ts";
import Stepper from "./Stepper.ts";

describe("Pulses.deregister() - Stepper updates", () => {
  let pulses: Pulses;
  let steppers: Stepper[];

  beforeEach(() => {
    pulses = new Pulses();
    steppers = [];
    document.body.innerHTML = `
      <div id="steppers"></div>
      <div id="steppers-controls"></div>
    `;
  });

  it("1. update stepper count on existing pulse decrements count", () => {
    const stepper16a = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 0,
      sampleName: "hh",
    });
    const stepper16b = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 1,
      sampleName: "sn",
    });
    steppers.push(stepper16a, stepper16b);

    pulses.register(stepper16a, steppers);
    pulses.register(stepper16b, steppers);

    expect(pulses.getLeadPulses()[0].count).toBe(2);

    pulses.deregister(stepper16a);

    expect(pulses.getLeadPulses()[0].count).toBe(1);
    expect(pulses.size).toBe(1);
  });

  it("2. pulse with count 1 is deleted when stepper deregisters", () => {
    const stepper16 = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 0,
      sampleName: "hh",
    });
    steppers.push(stepper16);

    pulses.register(stepper16, steppers);

    expect(pulses.size).toBe(1);
    expect(pulses.getLeadPulses()[0].count).toBe(1);

    pulses.deregister(stepper16);

    expect(pulses.size).toBe(0);
    expect(pulses.isEmpty).toBe(true);
    expect(pulses.getLeadPulses().length).toBe(0);
  });

  it("3. pulse with count > 1 is kept when one stepper deregisters", () => {
    const stepper16a = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 0,
      sampleName: "hh",
    });
    const stepper16b = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 1,
      sampleName: "sn",
    });
    const stepper16c = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 2,
      sampleName: "kk",
    });
    steppers.push(stepper16a, stepper16b, stepper16c);

    pulses.register(stepper16a, steppers);
    pulses.register(stepper16b, steppers);
    pulses.register(stepper16c, steppers);

    expect(pulses.getLeadPulses()[0].count).toBe(3);

    pulses.deregister(stepper16a);

    expect(pulses.size).toBe(1);
    expect(pulses.getLeadPulses()[0].count).toBe(2);
    expect(pulses.getLeadPulses()[0].steps).toBe(16);
  });

  it("4. lead pulse with no subs is deleted when last stepper deregisters", () => {
    const stepper12 = new Stepper({
      beats: 3,
      stepsPerBeat: 4,
      id: 0,
      sampleName: "hh",
    });
    steppers.push(stepper12);

    pulses.register(stepper12, steppers);

    expect(pulses.size).toBe(1);
    expect(pulses.getLeadPulses()[0].lead).toBe(true);
    expect(pulses.getLeadPulses()[0].subs.length).toBe(0);

    pulses.deregister(stepper12);

    expect(pulses.size).toBe(0);
    expect(pulses.isEmpty).toBe(true);
    expect(pulses.getLeadPulses().length).toBe(0);
  });

  it("5. lead pulse with subs promotes first sub when deleted", () => {
    const stepper16 = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 0,
      sampleName: "hh",
    });
    const stepper8 = new Stepper({
      beats: 4,
      stepsPerBeat: 2,
      id: 1,
      sampleName: "sd",
    });
    const stepper4 = new Stepper({
      beats: 4,
      stepsPerBeat: 1,
      id: 2,
      sampleName: "hh",
    });
    steppers.push(stepper16, stepper8, stepper4);

    pulses.register(stepper16, steppers);
    pulses.register(stepper8, steppers);
    pulses.register(stepper4, steppers);

    expect(pulses.size).toBe(3);
    expect(pulses.getLeadPulses().length).toBe(1);
    expect(pulses.getLeadPulses()[0].steps).toBe(16);
    expect(pulses.getLeadPulses()[0].subs.length).toBe(2);

    pulses.deregister(stepper16);
    expect(pulses.size).toBe(2);
    expect(pulses.getLeadPulses().length).toBe(1);
    expect(pulses.getLeadPulses()[0].steps).toBe(8);
    expect(pulses.getLeadPulses()[0].lead).toBe(true);
    expect(pulses.getLeadPulses()[0].subs.length).toBe(1);
    expect(pulses.getLeadPulses()[0].subs[0].steps).toBe(4);
  });

  it("6. stepper unsubscribes from old pulse when updating", () => {
    const stepper16 = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 0,
      sampleName: "hh",
    });
    steppers.push(stepper16);

    pulses.register(stepper16, steppers);

    const originalSubscription = stepper16.pulseSubscription;
    expect(originalSubscription).not.toBeNull();
    expect(originalSubscription?.closed).toBe(false);

    pulses.deregister(stepper16);
    stepper16.updateBeats(3);
    pulses.register(stepper16, steppers);

    expect(originalSubscription?.closed).toBe(true);
  });

  it("7. stepper subscribes to new pulse after update", () => {
    const stepper16 = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 0,
      sampleName: "hh",
    });
    steppers.push(stepper16);

    pulses.register(stepper16, steppers);

    const originalSubscription = stepper16.pulseSubscription;

    pulses.deregister(stepper16);
    stepper16.updateBeats(3);
    pulses.register(stepper16, steppers);

    expect(stepper16.pulseSubscription).not.toBeNull();
    expect(stepper16.pulseSubscription).not.toBe(originalSubscription);
    expect(stepper16.pulseSubscription?.closed).toBe(false);
    expect(stepper16.steps).toBe(12);
    expect(pulses.getLeadPulses()[0].steps).toBe(12);
  });

  it("8. updating stepper to existing pulse increments count", () => {
    const stepper16 = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 0,
      sampleName: "hh",
    });
    const stepper12 = new Stepper({
      beats: 3,
      stepsPerBeat: 4,
      id: 1,
      sampleName: "sn",
    });
    steppers.push(stepper16, stepper12);

    pulses.register(stepper16, steppers);
    pulses.register(stepper12, steppers);

    expect(pulses.size).toBe(2);
    expect(pulses.getLeadPulses().find((p) => p.steps === 16)?.count).toBe(1);

    pulses.deregister(stepper12);
    stepper12.updateBeats(4);
    pulses.register(stepper12, steppers);

    expect(pulses.size).toBe(1);
    expect(pulses.getLeadPulses()[0].steps).toBe(16);
    expect(pulses.getLeadPulses()[0].count).toBe(2);
  });

  it("9. rapid succession updates handled correctly (deregister-register cycle)", () => {
    const stepper16a = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 0,
      sampleName: "hh",
    });
    const stepper16b = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 1,
      sampleName: "sn",
    });
    const stepper16c = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 2,
      sampleName: "kk",
    });
    steppers.push(stepper16a, stepper16b, stepper16c);

    pulses.register(stepper16a, steppers);
    pulses.register(stepper16b, steppers);
    pulses.register(stepper16c, steppers);

    expect(pulses.getLeadPulses()[0].count).toBe(3);

    const updates = [
      { stepper: stepper16a, beats: 3 },
      { stepper: stepper16b, beats: 2 },
      { stepper: stepper16c, beats: 5 },
    ];

    for (const { stepper, beats } of updates) {
      pulses.deregister(stepper);
      stepper.updateBeats(beats);
      pulses.register(stepper, steppers);
    }

    expect(pulses.size).toBe(3);
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
    const stepper16 = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 0,
      sampleName: "hh",
    });
    const stepper8 = new Stepper({
      beats: 4,
      stepsPerBeat: 2,
      id: 1,
      sampleName: "sn",
    });
    steppers.push(stepper16, stepper8);

    pulses.register(stepper16, steppers);
    pulses.register(stepper8, steppers);

    expect(pulses.size).toBe(2);
    expect(pulses.getLeadPulses().length).toBe(1);

    const leadStepsInElements = pulses
      .getElements()
      .filter((p) => p.lead).length;
    expect(leadStepsInElements).toBe(pulses.getLeadPulses().length);

    pulses.deregister(stepper16);

    expect(pulses.size).toBe(1);
    expect(pulses.getLeadPulses().length).toBe(1);
    expect(pulses.getLeadPulses()[0].steps).toBe(8);

    const leadStepsInElementsAfter = pulses
      .getElements()
      .filter((p) => p.lead).length;
    expect(leadStepsInElementsAfter).toBe(pulses.getLeadPulses().length);

    pulses.getLeadPulses().forEach((leadPulse) => {
      expect(pulses.getElements().includes(leadPulse)).toBe(true);
    });
  });
});
