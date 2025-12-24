# Description:

- A pulse is an object that notifies steppers at a regular interval of time. Take a look at the current code of Stepper, Pulses and Pulse to realize the state management shortcomings, especially when updating steppers. The pulses and leadPulses array can easily become out of sync with what is happening with the steppers and their subscriptions.
  - **OBSERVATION**: Current state management issues identified:
    1. Manual array management in `Pulses.elements` and `Pulses.leadPulses` can desync
    2. Subscription cleanup relies on manual `unsubscribe()` calls in Stepper
    3. No validation that a pulse's `count` matches actual stepper subscriptions
    4. When updating a stepper's size, complex logic in `Pulses.register()` can miss edge cases
- The interval of time is a function of Pulse.steps, there must be only one Pulse per number of steps existing in the application. Eg: If there are 3 steppers of 8 steps, one Pulse of 8 steps (or size 8) must exist to notify these steppers
  - **CONFIRMED**: One Pulse instance per unique step count (e.g., 8, 16, 32)
- We need a Datastrucutre to access pulses and to maintain information about existing pulses.
  - **[RESOLVED]**: Use `Map<steps, Pulse>` for primary storage instead of arrays.
    - Rationale: O(1) lookup by steps instead of O(n) array search.
    - Benefits: Faster registration, deregistration, and update operations.
    - Lead pulse tracking: Maintain a separate sorted array of steps for lead pulses, rebuilt from Map when needed.
- The pulses class will interact directly with the steppers
  - **CONFIRMED**: Pulses orchestrates which pulse each stepper listens to
- Multiple lifecycles events matter to the Pulses: STEPPER REGISTRATION, STEPPER UPDATE
  - **OBSERVATION**: Currently handles REGISTRATION and DEREGISTRATION. UPDATE is not explicitly handled as a single event.
  - **[RESOLVED]**: STEPPER UPDATE should be handled via:
    c) An atomic transaction that ensures no pulses are orphaned during the update. If an error occurs, it should be logged or thrown.
    - Rationale: Ensures consistency and prevents partial state updates that could orphan pulses or steppers.

# Requirements for a datastructure to hold pulses:

- A pulse will also know if other existing pulses are subdivisions of itself (number of steps).

  - **CONFIRMED**: Currently implemented via `Pulse.subs[]` array tracking child pulses
  - **[RESOLVED]**: Pulse should NOT maintain parent reference.
    - Rationale: Parent-child relationships can be queried from the Pulses manager when needed.
    - Avoids circular references and simplifies pulse lifecycle management.
    - Parent can be found in O(1) time using the Map-based structure.

- only the minimum number of pulses necessary are created at all times

  - **CONFIRMED**: Current logic attempts this, but edge cases during updates may create temporary redundant pulses
  - **[RESOLVED]**: "Minimum" means fewest lead pulses necessary to serve all steppers.
    - Allow multiple lead pulses only when they have no parent-child relationship.
    - Always consolidate under the largest possible parent when mathematical relationships exist.
    - Example: Steppers [7, 11, 16, 8] → leads [7, 11, 16] with 8 as child of 16 (not 4 separate leads).

- Each pulse has keeps the COUNT of how many steppers are currently listening to it

  - **CONFIRMED**: `Pulse.count` tracks this
  - **[RESOLVED]**: Replace `count` with `Set<Stepper>` containing actual stepper references.
    - Rationale: Enables validation, debugging, and provides direct access to listening steppers.
    - The `count` can be derived from `steppers.size` when needed.

- A stepper can be updated (beats and stepsPerBeat), the Pulses datastructure MUST update itself accordingly
  - **OBSERVATION**: Current implementation updates stepper size in `Stepper.updateBeats()` and `Stepper.updateStepsPerBeat()` but doesn't notify Pulses class
  - **[RESOLVED]**: Stepper triggers the update by calling `pulses.update(this, oldSteps, newSteps)`.
    - Rationale: Stepper knows when its size changes, so it has the most immediate context to trigger the update.
- If a stepper is created it must have a pulse to listen to. The pulses' size may be a factor of its number of steps (e.g : 8 can listen to 32)

  - **CONFIRMED**: A child stepper (8 steps) can listen to a parent pulse (32 steps) and filter via `isSelectedStep()` logic
  - **[RESOLVED]**: No maximum parent/child ratio enforcement.
    - Rationale: The filtering logic handles any ratio efficiently.
    - Performance impact is negligible (simple modulo check per tick).
    - Enforcing limits adds complexity without clear benefit.

- A child stepper can be created after a parent, and should listen to its parent and be easily identifiable via the parent Pulse itself

  - **CONFIRMED**: `parent.addSub(childPulse)` tracks this relationship
  - **[RESOLVED]**: Parent pulse should expose `getChildrenSteppers(): Stepper[]` method.
    - Rationale: Provides clear API for accessing all steppers listening to child pulses.
    - Implementation: Traverse subs array and collect all steppers from each child pulse.

- A stepper update means a parent stepper's pulse may disappear. It should make the next appropriate pulse the lead, and the children pulses affected should subscribe to the parent.

  - **OBSERVATION**: Current `deregister()` attempts to promote successor pulse from `subs[0]`
  - **[RESOLVED]**: Promote the largest child pulse (maximum steps value).
    - Rationale: A larger pulse can accommodate more steppers whose steps are subdivisions of its size.
    - Example: When removing pulse 64 with subs [32, 16, 8], promote 32 (not 8 or 16).

- No matter the order of creation, parent or children or siblings at creation and update, the Pulses datastructure should enforce and reflect the current state of each steppers current source of truth.
  - **CONFIRMED**: The goal is order-independent correctness
  - **[RESOLVED]**: The source of truth is the largest pulse that can accommodate the most steppers.
    - Strategy: Always prefer the largest pulse as the lead to minimize total lead pulses.
    - Example 1: With steppers [64, 32, 16, 8, 4], pulse 64 is lead with subs [32, 16, 8, 4].
    - Example 2: If the 64-step stepper is updated to 63 steps:
      1. Pulse 64 is deregistered (no steppers need it)
      2. Pulse 32 is promoted to lead with subs [16, 8, 4]
      3. New pulse 63 is created as a separate lead (no mathematical relationship with others)
    - Mathematical basis: Use factor/multiple relationships (a is child of b if b % a === 0)
  - **[RESOLVED]**: Hierarchy should be rebuilt incrementally during each update operation.
    - Rationale: Full rebuilds are expensive; incremental updates maintain consistency if implemented correctly.
    - Atomic update transactions ensure intermediate states are never visible.

# INSTRUCTIONS:

## PHASE 1 - Feedback:

- Comment these explanations and these requirements. Identifiy uncertainties with [UNCLEAR] and list and explain them, ask questions if needed
- Update this file directcly

### PHASE 1 COMPLETE - All Uncertainties Resolved ✓

**Key Design Decisions:**

1. **Stepper Update Event Handling**: ✓ RESOLVED

   - Use atomic transaction: `pulses.update(stepper, oldSteps, newSteps)`
   - Stepper triggers the update when its size changes
   - Ensures no pulses or steppers are orphaned during updates

2. **Pulse Hierarchy "Source of Truth"**: ✓ RESOLVED

   - Strategy: Minimize lead pulses by consolidating under largest possible parent
   - Example: Steppers [8, 16, 32, 64] → 64 is lead with subs [32, 16, 8]
   - Mathematical basis: Child relationships via factor/multiple (b % a === 0)

3. **Stepper Tracking**: ✓ RESOLVED

   - Replace `Pulse.count` with `Set<Stepper>`
   - Enables validation, debugging, and direct stepper access
   - Count derived from `steppers.size` when needed

4. **Parent Pulse Promotion Strategy**: ✓ RESOLVED

   - Promote the largest child (maximum steps value)
   - Ensures maximum steppers can be accommodated by promoted pulse

5. **Data Structure Choice**: ✓ RESOLVED
   - Primary storage: `Map<steps, Pulse>` for O(1) lookups
   - Lead tracking: Sorted array of lead pulse steps
   - See "Recommended Data Structure Architecture" below

---

## Recommended Data Structure Architecture

Based on analysis in pulse-analysis.md and resolved requirements:

### Primary Storage

```typescript
class Pulses {
  private pulses: Map<number, Pulse>; // O(1) lookup by steps
  private leadSteps: number[]; // Sorted descending for hierarchy queries

  // ... methods
}
```

### Pulse Structure

```typescript
class Pulse {
  readonly steps: number; // Immutable identifier
  private steppers: Set<Stepper>; // Direct stepper references
  private subs: Pulse[] | null; // null = no children, [] = has children
  lead: boolean; // Is this a lead pulse?

  get count(): number {
    return this.steppers.size;
  }

  getChildrenSteppers(): Stepper[] {
    // Traverse subs and collect all steppers
  }
}
```

### Key Benefits

1. **Performance**: O(1) pulse lookup vs O(n) array search
2. **Validation**: Direct stepper references enable consistency checks
3. **Debugging**: `Set<Stepper>` makes it easy to inspect which steppers listen to each pulse
4. **Hierarchy Management**: Sorted `leadSteps` array enables efficient parent/child queries
5. **Memory Efficiency**: Single Pulse instance per step count, referenced by Map

### Operations Complexity

- **Register**: O(log n) - Map lookup O(1) + sorted insert O(log n)
- **Deregister**: O(log n) - Map lookup O(1) + sorted removal O(log n)
- **Update**: O(log n) - Deregister + Register
- **Find Parent**: O(log n) - Binary search on sorted leadSteps
- **Find Children**: O(log n) - Binary search on sorted leadSteps

## PHASE 2 - Proposal:

- Create a proposal.md file in this directory.
- Already list all classes and method names to be created and their signatures
- Create a section about lifecycles, with several scenarios and orders of updates. For all of them explain how the new proposal processes it.
  Explain the 'advantage' over the current architecture if there is one.

## PHASE 3 - Prototype:

- Propose Pulses and Pulse and if needed updates to stepper. Create all necessary files inside of /src/components/experimental. Write typescript directly with comments. These classes can import one another if necessary
