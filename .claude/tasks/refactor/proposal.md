# Pulses Refactor Proposal

## Overview

This proposal outlines a refactored architecture for the Pulses system that addresses the state management shortcomings identified in the current implementation. The new design uses a Map-based structure with Set-based stepper tracking to ensure consistency, improve performance, and simplify lifecycle management.

---

## Class Definitions & Method Signatures

### Pulse Class

```typescript
class Pulse {
  // Properties
  readonly steps: number;                     // Immutable identifier
  private steppers: Set<Stepper>;             // Direct stepper references
  private subs: Pulse[] | null;               // Child pulses (null = no children)
  lead: boolean;                              // Whether this is a lead pulse

  // Constructor
  constructor(steps: number, lead?: boolean);

  // Stepper Management
  addStepper(stepper: Stepper): void;
  removeStepper(stepper: Stepper): boolean;   // Returns true if pulse should be deleted
  hasSteppers(): boolean;
  getSteppers(): Set<Stepper>;

  // Hierarchy Management
  addSub(pulse: Pulse): void;
  removeSub(pulse: Pulse): void;
  clearSubs(): void;
  getSubs(): Pulse[] | null;
  hasSubs(): boolean;

  // Query Methods
  get count(): number;                        // Returns steppers.size
  getChildrenSteppers(): Stepper[];          // All steppers from this pulse and its subs
  getAllSteppers(): Stepper[];               // Traverse entire subtree
  isParentOf(steps: number): boolean;        // Check if steps can be a child (this.steps % steps === 0)
  isChildOf(steps: number): boolean;         // Check if steps can be a parent (steps % this.steps === 0)

  // Notification
  notify(): void;                            // Notify all steppers in this pulse
}
```

### Pulses Class

```typescript
class Pulses {
  // Properties
  private pulses: Map<number, Pulse>;        // All pulses, indexed by steps
  private leadSteps: number[];               // Sorted array of lead pulse steps (descending)

  // Constructor
  constructor();

  // Primary Operations
  register(stepper: Stepper): void;
  deregister(stepper: Stepper): void;
  update(stepper: Stepper, oldSteps: number, newSteps: number): void;

  // Pulse Lifecycle (Private/Internal)
  private getOrCreatePulse(steps: number, asLead: boolean): Pulse;
  private deletePulse(steps: number): void;
  private promoteToLead(pulse: Pulse): void;
  private demoteFromLead(pulse: Pulse): void;

  // Hierarchy Management (Private/Internal)
  private findParentPulse(steps: number): Pulse | null;
  private findChildPulses(steps: number): Pulse[];
  private findLargestChild(pulse: Pulse): Pulse | null;
  private assignToParent(pulse: Pulse, parent: Pulse): void;
  private promoteChild(parent: Pulse): void;

  // Lead Pulse Array Management (Private/Internal)
  private addToLeadSteps(steps: number): void;
  private removeFromLeadSteps(steps: number): void;
  private rebuildLeadSteps(): void;           // Emergency rebuild if needed

  // Query Methods
  getPulse(steps: number): Pulse | undefined;
  getLeadPulses(): Pulse[];
  getAllPulses(): Pulse[];
  validateState(): boolean;                   // Debug/test method to ensure consistency

  // Notification
  notifyAll(): void;                         // Notify all lead pulses
}
```

### Stepper Updates

The Stepper class needs minimal changes to trigger updates:

```typescript
class Stepper {
  // ... existing properties

  updateBeats(beats: number): void {
    const oldSteps = this.steps;
    this.beats = beats;
    // Notify Pulses of the change
    pulses.update(this, oldSteps, this.steps);
  }

  updateStepsPerBeat(stepsPerBeat: number): void {
    const oldSteps = this.steps;
    this.stepsPerBeat = stepsPerBeat;
    // Notify Pulses of the change
    pulses.update(this, oldSteps, this.steps);
  }

  // ... existing methods
}
```

---

## Lifecycle Scenarios

### Scenario 1: Sequential Registration (Ascending Order)

**Input**: Register steppers with steps [8, 16, 32, 64] in order

**Process**:

1. **Register Stepper(8)**
   - Map: `{8: Pulse(8, lead=true)}`
   - leadSteps: `[8]`
   - Pulse(8).steppers: `{Stepper(8)}`

2. **Register Stepper(16)**
   - Find parent: None (8 is not a parent of 16)
   - Find children: Pulse(8) is a child (16 % 8 === 0)
   - Create Pulse(16) as lead
   - Demote Pulse(8), add to Pulse(16).subs
   - Map: `{8: Pulse(8, lead=false), 16: Pulse(16, lead=true)}`
   - leadSteps: `[16]`
   - Pulse(16).subs: `[Pulse(8)]`

3. **Register Stepper(32)**
   - Find parent: None
   - Find children: Pulse(16) is a child (32 % 16 === 0), Pulse(8) is a child (32 % 8 === 0)
   - Create Pulse(32) as lead
   - Demote Pulse(16)
   - Transfer Pulse(16).subs to Pulse(32).subs
   - Add Pulse(16) to Pulse(32).subs
   - Map: `{8: Pulse(8, lead=false), 16: Pulse(16, lead=false), 32: Pulse(32, lead=true)}`
   - leadSteps: `[32]`
   - Pulse(32).subs: `[16, 8]` (flat structure)

4. **Register Stepper(64)**
   - Same process as step 3
   - Final state:
     - Map: `{8: Pulse(8), 16: Pulse(16), 32: Pulse(32), 64: Pulse(64, lead=true)}`
     - leadSteps: `[64]`
     - Pulse(64).subs: `[32, 16, 8]`

**Advantage**: Order-independent correctness. The same final state is achieved regardless of registration order.

---

### Scenario 2: Sequential Registration (Descending Order)

**Input**: Register steppers with steps [64, 32, 16, 8] in order

**Process**:

1. **Register Stepper(64)**
   - Map: `{64: Pulse(64, lead=true)}`
   - leadSteps: `[64]`

2. **Register Stepper(32)**
   - Find parent: Pulse(64) is parent (64 % 32 === 0)
   - Create Pulse(32) as non-lead
   - Add to Pulse(64).subs
   - Map: `{64: Pulse(64, lead=true), 32: Pulse(32, lead=false)}`
   - leadSteps: `[64]`
   - Pulse(64).subs: `[32]`

3. **Register Stepper(16)**
   - Find parent: Pulse(64) is parent, Pulse(32) is parent
   - Choose largest parent: Pulse(64)
   - Create Pulse(16) as non-lead, add to Pulse(64).subs
   - Map: `{64: Pulse(64), 32: Pulse(32), 16: Pulse(16)}`
   - leadSteps: `[64]`
   - Pulse(64).subs: `[32, 16]`

4. **Register Stepper(8)**
   - Find parent: Pulse(64) (largest)
   - Add Pulse(8) to Pulse(64).subs
   - Final state:
     - Map: `{64: Pulse(64), 32: Pulse(32), 16: Pulse(16), 8: Pulse(8)}`
     - leadSteps: `[64]`
     - Pulse(64).subs: `[32, 16, 8]`

**Result**: Identical final state to Scenario 1.

**Advantage**: Registration order doesn't matter. The hierarchy is always optimized to minimize lead pulses.

---

### Scenario 3: Random Registration Order

**Input**: Register steppers with steps [16, 4, 64, 8] in order

**Process**:

1. **Register Stepper(16)** → Lead pulse created
2. **Register Stepper(4)** → Child of 16, added to subs
3. **Register Stepper(64)** → Parent of 16, becomes lead, demotes 16
   - Pulse(64).subs: `[16, 4]` (flat transfer from Pulse(16).subs)
4. **Register Stepper(8)** → Child of 64, added to subs
   - Final: Pulse(64).subs: `[16, 8, 4]`

**Result**: Same hierarchy as Scenarios 1 & 2.

**Advantage**: No matter how chaotic the registration order, the final structure is always optimal.

---

### Scenario 4: Stepper Update Causing Promotion

**Input**:
- Initial state: Steppers [64, 32, 16, 8] → Pulse(64) is lead with subs [32, 16, 8]
- Update: Stepper(64) changes to 63 steps

**Process**:

1. **pulses.update(stepper, 64, 63) called**
2. **Atomic Transaction Begins**
3. **Deregister from old pulse (64)**:
   - Remove Stepper(64) from Pulse(64).steppers
   - Pulse(64).steppers is now empty
   - Pulse(64) has subs: [32, 16, 8]
   - Promotion required!
4. **Promote largest child**:
   - Find largest in subs: Pulse(32)
   - Pulse(32) becomes lead
   - Transfer Pulse(64).subs (excluding 32) to Pulse(32).subs: [16, 8]
   - Delete Pulse(64)
   - leadSteps: `[32]`
5. **Register to new pulse (63)**:
   - Find parent: None (63 is prime factors 7×9, no relationship with 32, 16, 8)
   - Create Pulse(63) as new lead
   - leadSteps: `[63, 32]` (sorted descending)
6. **Transaction Complete**

**Final State**:
- Map: `{63: Pulse(63), 32: Pulse(32), 16: Pulse(16), 8: Pulse(8)}`
- leadSteps: `[63, 32]`
- Pulse(32).subs: `[16, 8]`
- Pulse(63).subs: `null`

**Advantage**: Atomic transactions ensure no intermediate invalid states. If registration of 63 fails, the entire operation rolls back.

---

### Scenario 5: Multiple Unrelated Pulses

**Input**: Register steppers with steps [7, 11, 13] (all prime, no relationships)

**Process**:

1. **Register Stepper(7)** → Pulse(7) created as lead
2. **Register Stepper(11)** → No parent/child relationship with 7 → Pulse(11) created as lead
3. **Register Stepper(13)** → No relationships → Pulse(13) created as lead

**Final State**:
- Map: `{7: Pulse(7), 11: Pulse(11), 13: Pulse(13)}`
- leadSteps: `[13, 11, 7]` (sorted descending)
- All pulses have `subs: null`

**Advantage**: The system correctly identifies when pulses cannot be consolidated and maintains separate leads.

---

### Scenario 6: Deregistration Requiring Cleanup

**Input**:
- Initial: Steppers [64, 32, 16, 8] → Pulse(64) with subs [32, 16, 8]
- Deregister: Stepper(64)

**Process**:

1. **pulses.deregister(stepper(64)) called**
2. **Find pulse**: Pulse(64)
3. **Remove stepper**: Pulse(64).removeStepper(stepper(64))
4. **Check if pulse should be deleted**: Pulse(64).steppers.size === 0
5. **Pulse has subs**: Promote largest child
   - Find largest: Pulse(32)
   - Promote Pulse(32) to lead
   - Transfer Pulse(64).subs to Pulse(32).subs: [16, 8]
   - Delete Pulse(64)
   - Update leadSteps: `[32]`

**Final State**:
- Map: `{32: Pulse(32), 16: Pulse(16), 8: Pulse(8)}`
- leadSteps: `[32]`
- Pulse(32).subs: `[16, 8]`

**Advantage**: Automatic hierarchy reorganization ensures no orphaned pulses.

---

### Scenario 7: Duplicate Stepper Registration

**Input**: Register Stepper(16) twice

**Process**:

1. **First registration**:
   - Create Pulse(16)
   - Add stepper to Pulse(16).steppers

2. **Second registration (same stepper instance)**:
   - Find existing Pulse(16)
   - Add to Pulse(16).steppers (Set prevents duplicates)
   - No change (Set already contains the stepper)

3. **Second registration (different stepper instance with same steps)**:
   - Find existing Pulse(16)
   - Add new stepper to Pulse(16).steppers
   - Pulse(16).steppers: `{Stepper(16)a, Stepper(16)b}`
   - Pulse(16).count: `2`

**Advantage**: Set-based storage naturally handles duplicates. Multiple steppers with same steps share one pulse.

---

### Scenario 8: Complex Update Chain

**Input**:
- Initial: Steppers [64, 32, 16, 8, 4] → Pulse(64) with subs [32, 16, 8, 4]
- Update sequence:
  1. Stepper(8) → 7 steps
  2. Stepper(16) → 12 steps
  3. Stepper(4) → 2 steps

**Process**:

**Update 1: Stepper(8) → 7**
1. Deregister from Pulse(8) (child of 64)
2. Remove Pulse(8) from Pulse(64).subs
3. Create Pulse(7) as new lead (7 is prime, no relationship with 64, 32, 16, 4)
4. State: leadSteps `[64, 7]`, Pulse(64).subs: `[32, 16, 4]`

**Update 2: Stepper(16) → 12**
1. Deregister from Pulse(16)
2. Remove Pulse(16) from Pulse(64).subs
3. Find parent for 12: Pulse(64) is parent (64 % 12 !== 0, no), Pulse(32)? (32 % 12 !== 0, no)
4. Find children for 12: Pulse(4) is child (12 % 4 === 0)
5. Create Pulse(12) as new lead (no parent found)
6. Remove Pulse(4) from Pulse(64).subs, add to Pulse(12).subs
7. State: leadSteps `[64, 12, 7]`, Pulse(64).subs: `[32]`, Pulse(12).subs: `[4]`

**Update 3: Stepper(4) → 2**
1. Deregister from Pulse(4) (child of 12)
2. Remove Pulse(4) from Pulse(12).subs (now empty)
3. Find parent for 2: Pulse(64), Pulse(32), Pulse(12) (12 % 2 === 0, yes!)
4. Create Pulse(2) as non-lead, add to Pulse(12).subs
5. Final State:
   - leadSteps: `[64, 12, 7]`
   - Pulse(64).subs: `[32]`
   - Pulse(12).subs: `[2]`
   - Pulse(7).subs: `null`

**Advantage**: Complex update chains are handled atomically. Each update maintains hierarchy invariants.

---

## Advantages Over Current Architecture

### 1. **Consistency Guarantees**

**Current**: Manual array management can desync `elements` and `leadPulses`
**New**: Single source of truth (Map) with derived lead tracking. Impossible to have inconsistent state.

### 2. **Performance**

**Current**: O(n) searches through arrays for every operation
**New**: O(1) pulse lookup, O(log n) hierarchy operations

| Operation | Current | New |
|-----------|---------|-----|
| Find pulse by steps | O(n) | O(1) |
| Register stepper | O(n²) | O(log n) |
| Deregister stepper | O(n²) | O(log n) |
| Update stepper | O(n²) | O(log n) |
| Find parent/children | O(n) | O(log n) |

### 3. **Validation & Debugging**

**Current**: `count` is just a number, can drift from reality
**New**: `Set<Stepper>` enables:
- Direct inspection of which steppers listen to each pulse
- Validation that count matches reality: `pulse.steppers.size`
- Easy debugging: iterate over actual stepper references

### 4. **Atomic Updates**

**Current**: Updates call `listenToPulse()` again, complex manual cleanup
**New**: Explicit `update(stepper, oldSteps, newSteps)` with transaction semantics:
- Deregister from old pulse
- Reorganize hierarchy if needed
- Register to new pulse
- If any step fails, entire operation rolls back

### 5. **Simplified Lifecycle Management**

**Current**: Multiple methods (`addLead`, `demote`, `clearSubs`, `register`, `deregister`) called in complex order
**New**: Single entry points (`register`, `deregister`, `update`) with internal helper methods that maintain invariants

### 6. **Order Independence**

**Current**: Subtle bugs can occur depending on registration order
**New**: Guaranteed same final state regardless of order (proven in Scenarios 1-3)

### 7. **No Manual Subscription Management**

**Current**: Stepper must manually `unsubscribe()` before calling `listenToPulse()` again
**New**: Pulses system owns the relationship. Stepper just calls `update()` and everything is handled.

### 8. **Testability**

**Current**: Hard to validate state consistency
**New**: `validateState()` method can check invariants:
- Every pulse in leadSteps is in the Map and has `lead=true`
- Every pulse in Map is either lead or in some parent's subs
- No pulse appears in multiple parents' subs
- All steppers in a pulse's Set actually reference that pulse

---

## Implementation Strategy

### Phase 3 Tasks

1. **Create Pulse class** in `/src/components/experimental/Pulse.ts`
   - Set-based stepper management
   - Hierarchy methods (addSub, removeSub, etc.)
   - Query methods (getChildrenSteppers, etc.)

2. **Create Pulses class** in `/src/components/experimental/Pulses.ts`
   - Map-based storage
   - Registration/deregistration with atomic updates
   - Hierarchy management (promotion, demotion, transfer)
   - Lead array maintenance

3. **Update Stepper class** (minimal changes)
   - Add `pulses.update()` calls in `updateBeats()` and `updateStepsPerBeat()`
   - Remove manual `unsubscribe()` logic (handled by Pulses)

4. **Validation & Testing**
   - Implement `validateState()` for consistency checking
   - Port existing tests to use new architecture
   - Add new tests for atomic update scenarios

---

## Migration Path

### Option 1: Big Bang (Recommended for this codebase)

Replace entire Pulses/Pulse implementation in one go:
1. Implement new classes in `experimental/`
2. Write comprehensive tests
3. Swap old implementation for new
4. Remove old files

### Option 2: Gradual (If needed)

1. Create adapter layer that wraps new implementation
2. Maintain both old and new APIs temporarily
3. Migrate callers one by one
4. Remove old implementation once all migrated

**Recommendation**: Option 1, as the codebase is relatively small and the API surface is contained.

---

## Next Steps

Proceed to **Phase 3** to implement the prototype with full TypeScript code and comments in `/src/components/experimental/`.
