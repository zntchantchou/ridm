import { beforeEach, describe, expect, it } from "vitest";
import { PulseClass } from "../modules/Pulses.ts";
import Stepper from "../components/Stepper.ts";

describe("Pulses.deregister() - Stepper updates", () => {
  let pulses: InstanceType<typeof PulseClass>;

  beforeEach(() => {
    pulses = new PulseClass();
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
      color: { name: "blue", cssColor: "#00d0ff" },
    });
    const stepper16b = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 1,
      sampleName: "sn",
      color: { name: "purple", cssColor: "#9c37fb" },
    });

    pulses.register(stepper16a);
    pulses.register(stepper16b);

    expect(pulses.getLeadPulses()[0].count).toBe(2);

    pulses.deregister(stepper16a);

    expect(pulses.getLeadPulses()[0].count).toBe(1);
    expect(pulses.getAllPulses().length).toBe(1);
  });

  it("2. pulse with count 1 is deleted when stepper deregisters", () => {
    const stepper16 = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 0,
      sampleName: "hh",
      color: { name: "blue", cssColor: "#00d0ff" },
    });

    pulses.register(stepper16);

    expect(pulses.getAllPulses().length).toBe(1);
    expect(pulses.getLeadPulses()[0].count).toBe(1);

    pulses.deregister(stepper16);

    expect(pulses.getAllPulses().length).toBe(0);
    expect(pulses.getLeadPulses().length).toBe(0);
  });

  it("3. pulse with count > 1 is kept when one stepper deregisters", () => {
    const stepper16a = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 0,
      sampleName: "hh",
      color: { name: "blue", cssColor: "#00d0ff" },
    });
    const stepper16b = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 1,
      sampleName: "sn",
      color: { name: "purple", cssColor: "#9c37fb" },
    });
    const stepper16c = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 2,
      sampleName: "kk",
      color: { name: "yellow", cssColor: "#eeff04" },
    });

    pulses.register(stepper16a);
    pulses.register(stepper16b);
    pulses.register(stepper16c);

    expect(pulses.getLeadPulses()[0].count).toBe(3);

    pulses.deregister(stepper16a);

    expect(pulses.getAllPulses().length).toBe(1);
    expect(pulses.getLeadPulses()[0].count).toBe(2);
    expect(pulses.getLeadPulses()[0].steps).toBe(16);
  });

  it("4. lead pulse with no subs is deleted when last stepper deregisters", () => {
    const stepper12 = new Stepper({
      beats: 3,
      stepsPerBeat: 4,
      id: 0,
      sampleName: "hh",
      color: { name: "blue", cssColor: "#00d0ff" },
    });

    pulses.register(stepper12);

    expect(pulses.getAllPulses().length).toBe(1);
    expect(pulses.getLeadPulses()[0].lead).toBe(true);
    expect(pulses.getLeadPulses()[0].getSubs()?.length || 0).toBe(0);

    pulses.deregister(stepper12);

    expect(pulses.getAllPulses().length).toBe(0);
    expect(pulses.getLeadPulses().length).toBe(0);
  });

  it("5. lead pulse with subs promotes first sub when deleted", () => {
    const stepper16 = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 0,
      sampleName: "hh",
      color: { name: "blue", cssColor: "#00d0ff" },
    });
    const stepper8 = new Stepper({
      beats: 4,
      stepsPerBeat: 2,
      id: 1,
      sampleName: "sd",
      color: { name: "purple", cssColor: "#9c37fb" },
    });
    const stepper4 = new Stepper({
      beats: 4,
      stepsPerBeat: 1,
      id: 2,
      sampleName: "lt",
      color: { name: "yellow", cssColor: "#eeff04" },
    });

    pulses.register(stepper16);
    pulses.register(stepper8);
    pulses.register(stepper4);

    expect(pulses.getAllPulses().length).toBe(3);
    expect(pulses.getLeadPulses().length).toBe(1);
    expect(pulses.getLeadPulses()[0].steps).toBe(16);
    expect(pulses.getLeadPulses()[0].getSubs()?.length).toBe(2);

    pulses.deregister(stepper16);

    expect(pulses.getAllPulses().length).toBe(2);
    expect(pulses.getLeadPulses().length).toBe(1);
    expect(pulses.getLeadPulses()[0].steps).toBe(8);
    expect(pulses.getLeadPulses()[0].lead).toBe(true);
    expect(pulses.getLeadPulses()[0].getSubs()?.length).toBe(1);
    expect(pulses.getLeadPulses()[0].getSubs()?.[0].steps).toBe(4);
  });

  it("6. stepper unsubscribes from old pulse when updating", () => {
    const stepper16 = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 0,
      sampleName: "hh",
      color: { name: "blue", cssColor: "#00d0ff" },
    });

    pulses.register(stepper16);

    const originalSubscription = stepper16.pulseSubscription;
    expect(originalSubscription).not.toBeNull();
    expect(originalSubscription?.closed).toBe(false);

    pulses.deregister(stepper16);
    stepper16.updateBeats(3);
    pulses.register(stepper16);

    expect(originalSubscription?.closed).toBe(true);
  });

  it("7. stepper subscribes to new pulse after update", () => {
    const stepper16 = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 0,
      sampleName: "hh",
      color: { name: "blue", cssColor: "#00d0ff" },
    });

    pulses.register(stepper16);

    const originalSubscription = stepper16.pulseSubscription;

    pulses.deregister(stepper16);
    stepper16.updateBeats(3);
    pulses.register(stepper16);

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
      color: { name: "blue", cssColor: "#00d0ff" },
    });
    const stepper12 = new Stepper({
      beats: 3,
      stepsPerBeat: 4,
      id: 1,
      sampleName: "sn",
      color: { name: "purple", cssColor: "#9c37fb" },
    });

    pulses.register(stepper16);
    pulses.register(stepper12);

    expect(pulses.getAllPulses().length).toBe(2);
    expect(pulses.getPulse(16)?.count).toBe(1);

    pulses.deregister(stepper12);
    stepper12.updateBeats(4);
    pulses.register(stepper12);

    expect(pulses.getAllPulses().length).toBe(1);
    expect(pulses.getLeadPulses()[0].steps).toBe(16);
    expect(pulses.getLeadPulses()[0].count).toBe(2);
  });

  it("9. rapid succession updates handled correctly (deregister-register cycle)", () => {
    const stepper16a = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 0,
      sampleName: "hh",
      color: { name: "blue", cssColor: "#00d0ff" },
    });
    const stepper16b = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 1,
      sampleName: "sn",
      color: { name: "purple", cssColor: "#9c37fb" },
    });
    const stepper16c = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 2,
      sampleName: "kk",
      color: { name: "yellow", cssColor: "#eeff04" },
    });

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
      stepper.updateBeats(beats);
      pulses.register(stepper);
    }

    expect(pulses.getAllPulses().length).toBe(3);
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
      color: { name: "blue", cssColor: "#00d0ff" },
    });
    const stepper8 = new Stepper({
      beats: 4,
      stepsPerBeat: 2,
      id: 1,
      sampleName: "sn",
      color: { name: "purple", cssColor: "#9c37fb" },
    });

    pulses.register(stepper16);
    pulses.register(stepper8);

    expect(pulses.getAllPulses().length).toBe(2);
    expect(pulses.getLeadPulses().length).toBe(1);

    const leadStepsInElements = pulses
      .getAllPulses()
      .filter((p) => p.lead).length;
    expect(leadStepsInElements).toBe(pulses.getLeadPulses().length);

    pulses.deregister(stepper16);

    expect(pulses.getAllPulses().length).toBe(1);
    expect(pulses.getLeadPulses().length).toBe(1);
    expect(pulses.getLeadPulses()[0].steps).toBe(8);

    const leadStepsInElementsAfter = pulses
      .getAllPulses()
      .filter((p) => p.lead).length;
    expect(leadStepsInElementsAfter).toBe(pulses.getLeadPulses().length);

    pulses.getLeadPulses().forEach((leadPulse) => {
      expect(pulses.getAllPulses().includes(leadPulse)).toBe(true);
    });
  });
});
