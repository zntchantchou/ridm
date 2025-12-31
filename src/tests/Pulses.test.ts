import { beforeEach, describe, expect, it } from "vitest";
import { PulseClass } from "../modules/Pulses.ts";
import Stepper from "../components/Stepper.ts";

describe("Pulses.register()", () => {
  let pulses: InstanceType<typeof PulseClass>;

  beforeEach(() => {
    pulses = new PulseClass();
    document.body.innerHTML = '<div id="steppers"></div>';
  });

  it("1. registers stepper to empty Pulses correctly", () => {
    const stepper16 = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 1,
      sampleName: "bd",
      color: { name: "blue", cssColor: "#00d0ff" },
    });

    pulses.register(stepper16);

    expect(pulses.getAllPulses().length).toBe(1);
    expect(pulses.getLeadPulses().length).toBe(1);
    expect(pulses.getLeadPulses()[0].steps).toBe(16);
    expect(pulses.getLeadPulses()[0].count).toBe(1);
    expect(stepper16.pulseSubscription).not.toBeNull();
  });

  it("2. registers stepper to existing pulse with same steps", () => {
    const stepper16a = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 1,
      sampleName: "bd",
      color: { name: "blue", cssColor: "#00d0ff" },
    });
    const stepper16b = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 2,
      sampleName: "hh",
      color: { name: "purple", cssColor: "#9c37fb" },
    });

    pulses.register(stepper16a);
    pulses.register(stepper16b);

    expect(pulses.getAllPulses().length).toBe(1);
    expect(pulses.getLeadPulses().length).toBe(1);
    const pulse = pulses.getLeadPulses()[0];
    expect(pulse.steps).toBe(16);
    expect(pulse.count).toBe(2);
    expect(stepper16a.pulseSubscription).not.toBeNull();
    expect(stepper16b.pulseSubscription).not.toBeNull();
  });

  it("3. registers child pulse when parent exists", () => {
    const stepper16 = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 1,
      sampleName: "bd",
      color: { name: "blue", cssColor: "#00d0ff" },
    });
    const stepper8 = new Stepper({
      beats: 4,
      stepsPerBeat: 2,
      id: 2,
      sampleName: "sd",
      color: { name: "purple", cssColor: "#9c37fb" },
    });

    pulses.register(stepper16);
    pulses.register(stepper8);

    expect(pulses.getAllPulses().length).toBe(2);
    expect(pulses.getLeadPulses().length).toBe(1);
    expect(pulses.getLeadPulses()[0].steps).toBe(16);

    const parentPulse = pulses.getLeadPulses()[0];
    expect(parentPulse.getSubs()?.length).toBe(1);
    expect(parentPulse.getSubs()?.[0].steps).toBe(8);
    expect(stepper8.pulseSubscription).not.toBeNull();
  });

  it("4. registers parent pulse when child exists and reassigns subs", () => {
    const stepper8 = new Stepper({
      beats: 4,
      stepsPerBeat: 2,
      id: 2,
      sampleName: "bd",
      color: { name: "blue", cssColor: "#00d0ff" },
    });
    const stepper16 = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 1,
      sampleName: "sd",
      color: { name: "purple", cssColor: "#9c37fb" },
    });

    pulses.register(stepper8);
    expect(pulses.getLeadPulses()[0].steps).toBe(8);

    pulses.register(stepper16);

    expect(pulses.getAllPulses().length).toBe(2);
    expect(pulses.getLeadPulses().length).toBe(1);
    expect(pulses.getLeadPulses()[0].steps).toBe(16);

    const parentPulse = pulses.getLeadPulses()[0];
    expect(parentPulse.getSubs()?.length).toBe(1);
    expect(parentPulse.getSubs()?.[0].steps).toBe(8);
    expect(parentPulse.getSubs()?.[0].count).toBe(1);
    expect(stepper16.pulseSubscription).not.toBeNull();
  });

  it("5. registers many unrelated pulses correctly", () => {
    const stepper3 = new Stepper({
      beats: 3,
      stepsPerBeat: 1,
      id: 1,
      sampleName: "bd",
      color: { name: "blue", cssColor: "#00d0ff" },
    });
    const stepper5 = new Stepper({
      beats: 5,
      stepsPerBeat: 1,
      id: 2,
      sampleName: "sd",
      color: { name: "purple", cssColor: "#9c37fb" },
    });
    const stepper7 = new Stepper({
      beats: 7,
      stepsPerBeat: 1,
      id: 3,
      sampleName: "lt",
      color: { name: "yellow", cssColor: "#eeff04" },
    });

    pulses.register(stepper3);
    pulses.register(stepper5);
    pulses.register(stepper7);

    expect(pulses.getAllPulses().length).toBe(3);
    expect(pulses.getLeadPulses().length).toBe(3);

    const leadSteps = pulses.getLeadPulses().map((p) => p.steps);
    expect(leadSteps).toContain(3);
    expect(leadSteps).toContain(5);
    expect(leadSteps).toContain(7);

    pulses.getLeadPulses().forEach((pulse) => {
      expect(pulse.getSubs()?.length || 0).toBe(0);
    });
  });

  it("6. maintains leadPulses sorted descending by steps", () => {
    const stepper4 = new Stepper({
      beats: 4,
      stepsPerBeat: 1,
      id: 1,
      sampleName: "bd",
      color: { name: "blue", cssColor: "#00d0ff" },
    });
    const stepper16 = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 2,
      sampleName: "lt",
      color: { name: "purple", cssColor: "#9c37fb" },
    });
    const stepper12 = new Stepper({
      beats: 3,
      stepsPerBeat: 4,
      id: 4,
      sampleName: "hh",
      color: { name: "yellow", cssColor: "#eeff04" },
    });

    pulses.register(stepper4);
    pulses.register(stepper16);
    pulses.register(stepper12);

    expect(pulses.getLeadPulses().length).toBe(2);
    const leadSteps = pulses.getLeadPulses().map((p) => p.steps);
    expect(leadSteps[0]).toBeGreaterThan(leadSteps[1]);
    expect(leadSteps).toEqual([16, 12]);
  });

  it("7. updates pulse count when registering to existing pulse", () => {
    const stepper16a = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 1,
      sampleName: "bd",
      color: { name: "blue", cssColor: "#00d0ff" },
    });
    const stepper16b = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 2,
      sampleName: "sd",
      color: { name: "purple", cssColor: "#9c37fb" },
    });
    const stepper16c = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 3,
      sampleName: "hh",
      color: { name: "yellow", cssColor: "#eeff04" },
    });

    pulses.register(stepper16a);
    expect(pulses.getLeadPulses()[0].count).toBe(1);

    pulses.register(stepper16b);
    expect(pulses.getLeadPulses()[0].count).toBe(2);

    pulses.register(stepper16c);
    expect(pulses.getLeadPulses()[0].count).toBe(3);
  });

  it("8. reassigns steppers to new parent when parent pulse added", () => {
    const stepper4 = new Stepper({
      beats: 4,
      stepsPerBeat: 1,
      id: 1,
      sampleName: "bd",
      color: { name: "blue", cssColor: "#00d0ff" },
    });
    const stepper8 = new Stepper({
      beats: 4,
      stepsPerBeat: 2,
      id: 2,
      sampleName: "hh",
      color: { name: "purple", cssColor: "#9c37fb" },
    });
    const stepper16 = new Stepper({
      beats: 4,
      stepsPerBeat: 4,
      id: 3,
      sampleName: "sd",
      color: { name: "yellow", cssColor: "#eeff04" },
    });

    pulses.register(stepper8);
    const pulse8FirstSubscription = stepper8.pulseSubscription;

    pulses.register(stepper4);
    const pulse4FirstSubscription = stepper4.pulseSubscription;

    expect(pulses.getLeadPulses()[0].steps).toBe(8);
    expect(pulses.getLeadPulses()[0].getSubs()?.[0].steps).toBe(4);

    pulses.register(stepper16);
    const pulse16FirstSubscription = stepper16.pulseSubscription;

    expect(pulses.getLeadPulses().length).toBe(1);
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
    expect(stepper4.pulseSubscription).not.toBe(pulse4FirstSubscription); // This is the critical line that shows a problem
    expect(stepper4.pulseSubscription).toBeTruthy();
    expect(stepper16.pulseSubscription).toBe(pulse16FirstSubscription);
  });
});
