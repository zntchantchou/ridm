/**
 * @jest-environment jsdom
 */
import { describe, test, expect, beforeEach } from "@jest/globals";
import Pulses from "./Pulses";
import Pulse from "./Pulse";
import Stepper from "./Stepper";

const mockStepper = (steps: number) => ({ steps } as Stepper);

describe("Pulses - Edge Cases", () => {
  let pulses: Pulses;

  beforeEach(() => {
    pulses = new Pulses();
  });

  test("Register pulse with steps = 1 (divides everything)", () => {
    // Register larger pulses first
    pulses.register(mockStepper(16));
    pulses.register(mockStepper(8));
    pulses.register(mockStepper(4));

    // Register step 1 - should become parent of all
    pulses.register(mockStepper(1));

    const leadPulses = pulses.getLeadPulses();
    const elements = pulses.getElements();

    // 1 should NOT be in leadPulses because it's smaller than existing leads
    // It should be a child of the largest parent
    expect(elements.length).toBe(4);
    expect(leadPulses.length).toBe(1);
    expect(leadPulses[0].steps).toBe(16);
  });

  test("Register pulse with steps = 0 (edge case)", () => {
    expect(() => pulses.register(mockStepper(0))).not.toThrow();
    // Behavior with 0 should be defined - currently just adds it
    expect(pulses.size).toBe(1);
  });

  test("Register very large prime numbers (no relationships)", () => {
    const primes = [71, 73, 79, 83, 89, 97];

    primes.forEach((prime) => pulses.register(mockStepper(prime)));

    const leadPulses = pulses.getLeadPulses();
    const elements = pulses.getElements();

    // All primes should be lead pulses (no parent/child relationships)
    expect(elements.length).toBe(primes.length);
    expect(leadPulses.length).toBe(primes.length);

    // All should have lead = true
    leadPulses.forEach((pulse) => {
      expect(pulse.lead).toBe(true);
    });

    // All should have empty subs
    leadPulses.forEach((pulse) => {
      expect(pulse.subs.length).toBe(0);
    });

    // Should be sorted in descending order
    for (let i = 0; i < leadPulses.length - 1; i++) {
      expect(leadPulses[i].steps).toBeGreaterThan(leadPulses[i + 1].steps);
    }
  });
});

describe("Pulses - Duplicate Handling", () => {
  let pulses: Pulses;

  beforeEach(() => {
    pulses = new Pulses();
  });

  test("Register same stepper multiple times, verify count increments", () => {
    pulses.register(mockStepper(16));
    pulses.register(mockStepper(16));
    pulses.register(mockStepper(16));

    const elements = pulses.getElements();
    expect(elements.length).toBe(1);
    expect(elements[0].count).toBe(3);
  });

  test("Verify no duplicate pulses in elements array", () => {
    pulses.register(mockStepper(16));
    pulses.register(mockStepper(8));
    pulses.register(mockStepper(16));
    pulses.register(mockStepper(8));

    const elements = pulses.getElements();
    const steps = elements.map((e) => e.steps);
    const uniqueSteps = new Set(steps);

    expect(steps.length).toBe(uniqueSteps.size);
    expect(elements.length).toBe(2);
  });

  test("Verify no duplicate pulses in leadPulses array", () => {
    // Register unrelated pulses
    pulses.register(mockStepper(7));
    pulses.register(mockStepper(11));
    pulses.register(mockStepper(13));
    pulses.register(mockStepper(7)); // duplicate
    pulses.register(mockStepper(11)); // duplicate

    const leadPulses = pulses.getLeadPulses();
    const steps = leadPulses.map((p) => p.steps);
    const uniqueSteps = new Set(steps);

    expect(steps.length).toBe(uniqueSteps.size);
    expect(leadPulses.length).toBe(3);
  });

  test("Count increments for both lead and non-lead pulses", () => {
    pulses.register(mockStepper(16));
    pulses.register(mockStepper(4)); // child of 16

    // Register duplicates
    pulses.register(mockStepper(16));
    pulses.register(mockStepper(4));
    pulses.register(mockStepper(4));

    const elements = pulses.getElements();
    const pulse16 = elements.find((e) => e.steps === 16);
    const pulse4 = elements.find((e) => e.steps === 4);

    expect(pulse16?.count).toBe(2);
    expect(pulse4?.count).toBe(3);
  });
});

describe("Pulses - Complex Subdivision Chains", () => {
  let pulses: Pulses;

  beforeEach(() => {
    pulses = new Pulses();
  });

  test("Register in ascending order: [2, 4, 8, 16, 32, 64]", () => {
    const steps = [2, 4, 8, 16, 32, 64];
    steps.forEach((step) => pulses.register(mockStepper(step)));

    const leadPulses = pulses.getLeadPulses();
    const elements = pulses.getElements();

    expect(elements.length).toBe(6);
    expect(leadPulses.length).toBe(1);
    expect(leadPulses[0].steps).toBe(64);
    expect(leadPulses[0].lead).toBe(true);
    expect(leadPulses[0].subs.length).toBeGreaterThan(0);
  });

  test("Register in descending order: [64, 32, 16, 8, 4, 2]", () => {
    const steps = [64, 32, 16, 8, 4, 2];
    steps.forEach((step) => pulses.register(mockStepper(step)));

    const leadPulses = pulses.getLeadPulses();
    const elements = pulses.getElements();

    expect(elements.length).toBe(6);
    expect(leadPulses.length).toBe(1);
    expect(leadPulses[0].steps).toBe(64);
    expect(leadPulses[0].lead).toBe(true);
  });

  test("Register in random order: [16, 4, 32, 2, 64, 8]", () => {
    const steps = [16, 4, 32, 2, 64, 8];
    steps.forEach((step) => pulses.register(mockStepper(step)));

    const leadPulses = pulses.getLeadPulses();
    const elements = pulses.getElements();

    expect(elements.length).toBe(6);
    expect(leadPulses.length).toBe(1);
    expect(leadPulses[0].steps).toBe(64);
  });

  test("Verify final structure is same regardless of order", () => {
    const testOrders = [
      [2, 4, 8, 16, 32, 64],
      [64, 32, 16, 8, 4, 2],
      [16, 4, 32, 2, 64, 8],
      [32, 8, 64, 4, 2, 16],
    ];

    const results = testOrders.map((order) => {
      const testPulses = new Pulses();
      order.forEach((step) => testPulses.register(mockStepper(step)));
      return {
        leadCount: testPulses.getLeadPulses().length,
        leadSteps: testPulses.getLeadPulses()[0].steps,
        elementCount: testPulses.getElements().length,
      };
    });

    // All should have same structure
    results.forEach((result) => {
      expect(result.leadCount).toBe(1);
      expect(result.leadSteps).toBe(64);
      expect(result.elementCount).toBe(6);
    });
  });

  test("Deep chain maintains flat subs structure", () => {
    const steps = [64, 32, 16, 8, 4, 2];
    steps.forEach((step) => pulses.register(mockStepper(step)));

    const leadPulses = pulses.getLeadPulses();
    const lead = leadPulses[0];

    // Flat structure: all children should be in lead's subs
    expect(lead.subs.length).toBe(5); // [32, 16, 8, 4, 2]

    // Verify all subs are Pulse objects
    lead.subs.forEach((sub) => {
      expect(sub).toBeInstanceOf(Pulse);
      expect(typeof sub.steps).toBe("number");
    });
  });
});

describe("Pulses - Unrelated Pulses", () => {
  let pulses: Pulses;

  beforeEach(() => {
    pulses = new Pulses();
  });

  test("Two prime numbers should both become lead pulses", () => {
    pulses.register(mockStepper(7));
    pulses.register(mockStepper(11));

    const leadPulses = pulses.getLeadPulses();
    const elements = pulses.getElements();

    // Both should be lead pulses (no parent/child relationship)
    expect(elements.length).toBe(2);
    expect(leadPulses.length).toBe(2);

    // Both should have lead = true
    const pulse7 = elements.find((p) => p.steps === 7);
    const pulse11 = elements.find((p) => p.steps === 11);
    expect(pulse7?.lead).toBe(true);
    expect(pulse11?.lead).toBe(true);

    // Neither should have subs
    expect(pulse7?.subs.length).toBe(0);
    expect(pulse11?.subs.length).toBe(0);

    // Should be sorted in descending order
    expect(leadPulses[0].steps).toBe(11);
    expect(leadPulses[1].steps).toBe(7);
  });

  test("Numbers with GCD but neither parent/child (12 and 18, GCD=6)", () => {
    // 12 and 18 share common factor 6, but neither divides the other
    // 12 % 18 = 12 (not 0, so 18 is not parent of 12)
    // 18 % 12 = 6 (not 0, so 12 is not parent of 18)
    pulses.register(mockStepper(12));
    pulses.register(mockStepper(18));

    const leadPulses = pulses.getLeadPulses();
    const elements = pulses.getElements();

    // Both should be lead pulses
    expect(elements.length).toBe(2);
    expect(leadPulses.length).toBe(2);

    // Both should have lead = true
    const pulse12 = elements.find((p) => p.steps === 12);
    const pulse18 = elements.find((p) => p.steps === 18);
    expect(pulse12?.lead).toBe(true);
    expect(pulse18?.lead).toBe(true);

    // Neither should have subs
    expect(pulse12?.subs.length).toBe(0);
    expect(pulse18?.subs.length).toBe(0);

    // Should be sorted in descending order
    expect(leadPulses[0].steps).toBe(18);
    expect(leadPulses[1].steps).toBe(12);
  });

  test("Three mutually unrelated numbers (no divisibility)", () => {
    // 10, 15, 21 - different prime factors, no parent/child relationships
    // 10 = 2 × 5
    // 15 = 3 × 5
    // 21 = 3 × 7
    pulses.register(mockStepper(10));
    pulses.register(mockStepper(15));
    pulses.register(mockStepper(21));

    const leadPulses = pulses.getLeadPulses();
    const elements = pulses.getElements();

    // All should be lead pulses
    expect(elements.length).toBe(3);
    expect(leadPulses.length).toBe(3);

    // All should have lead = true
    elements.forEach((pulse) => {
      expect(pulse.lead).toBe(true);
    });

    // None should have subs
    elements.forEach((pulse) => {
      expect(pulse.subs.length).toBe(0);
    });

    // Should be sorted in descending order
    expect(leadPulses[0].steps).toBe(21);
    expect(leadPulses[1].steps).toBe(15);
    expect(leadPulses[2].steps).toBe(10);
  });

  test("Unrelated pulse doesn't interfere with existing parent-child relationship", () => {
    // Create parent-child relationship first
    pulses.register(mockStepper(16));
    pulses.register(mockStepper(8));

    // Add unrelated pulse
    pulses.register(mockStepper(7));

    const leadPulses = pulses.getLeadPulses();
    const elements = pulses.getElements();

    // Should have 2 lead pulses (16 and 7)
    expect(elements.length).toBe(3);
    expect(leadPulses.length).toBe(2);

    // Verify 16 still has 8 as sub
    const pulse16 = elements.find((p) => p.steps === 16);
    expect(pulse16?.subs.length).toBe(1);
    expect(pulse16?.subs[0].steps).toBe(8);

    // Verify 7 has no subs
    const pulse7 = elements.find((p) => p.steps === 7);
    expect(pulse7?.subs.length).toBe(0);

    // Verify 8 is not a lead
    const pulse8 = elements.find((p) => p.steps === 8);
    expect(pulse8?.lead).toBe(false);

    // Should be sorted descending: [16, 7]
    expect(leadPulses[0].steps).toBe(16);
    expect(leadPulses[1].steps).toBe(7);
  });

  test("Mix of related and unrelated pulses maintains correct structure", () => {
    // Register mixed: some related (8, 16), some unrelated (7, 11)
    pulses.register(mockStepper(8));
    pulses.register(mockStepper(7));
    pulses.register(mockStepper(16));
    pulses.register(mockStepper(11));

    const leadPulses = pulses.getLeadPulses();
    const elements = pulses.getElements();

    // Should have 3 lead pulses (16, 11, 7)
    expect(elements.length).toBe(4);
    expect(leadPulses.length).toBe(3);

    // Verify correct lead pulses
    const leadSteps = leadPulses.map((p) => p.steps).sort((a, b) => b - a);
    expect(leadSteps).toEqual([16, 11, 7]);

    // Verify 16 has 8 as sub
    const pulse16 = elements.find((p) => p.steps === 16);
    expect(pulse16?.subs.length).toBe(1);
    expect(pulse16?.subs[0].steps).toBe(8);

    // Verify 7 and 11 have no subs
    const pulse7 = elements.find((p) => p.steps === 7);
    const pulse11 = elements.find((p) => p.steps === 11);
    expect(pulse7?.subs.length).toBe(0);
    expect(pulse11?.subs.length).toBe(0);

    // Verify 8 is not lead
    const pulse8 = elements.find((p) => p.steps === 8);
    expect(pulse8?.lead).toBe(false);
  });
});
