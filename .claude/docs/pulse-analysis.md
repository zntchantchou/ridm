# Pulse System Analysis & Test Guidance

## Understanding from Documentation

### Core Data Structures

- **elements**: Contains ALL registered pulses (both lead and non-lead)
- **leadPulses**: Contains ONLY pulses where `pulse.lead === true`
- **Uniqueness**: Pulses are unique by their `steps` value
- **Sorting**: leadPulses must always be kept sorted

### Parent/Child Relationships

- **Child Pulse**: A pulse whose steps are a subdivision of a lead pulse

  - Example: 4 is a child of 16 (because 16 % 4 === 0)
  - Child pulses should NOT have subs

- **Parent Pulse**: A pulse whose steps are a multiple of another pulse
  - Example: 14 is a parent of 7 (because 14 % 7 === 0)
  - Parent pulses MUST have subs array populated

### Registration Rules

1. If pulse with same steps exists → increment its count
2. If new pulse is a child of existing lead → add as non-lead, add to parent's subs
3. If new pulse is a parent of existing lead → promote new pulse to lead, demote child
4. If neither parent nor child → create as new lead pulse

### Deregistration Rules

- When removing a child pulse → remove from parent's subs
- When removing a parent pulse → transfer all subs to the child with most steps

---

## Resolved Clarifications

### 1. Sort Order ✓

**Resolution**: leadPulses should be sorted in **descending order** (from faster to slower, in descending number of steps).

- Example: `[32, 16, 8, 4]` - largest to smallest

### 2. findChild Implementation ✓

**Resolution**: The logic `pulse.steps % steps === pulse.steps` is **correct** for identifying children.

- Example: `4 % 8 = 4`, so 4 is a child of 8
- This works because when the divisor is larger than the dividend, the modulo returns the dividend itself
- Steps will never be lower than 1

### 3. Subs Initialization ✓

**Resolution**: `subs` should be initialized as `null`.

- `null` = "no subs possible" (for non-lead pulses or lead pulses without children)
- `[]` = "has capacity for subs" (only for parent pulses with children)
- This semantic difference helps distinguish between different pulse states

### 4. Deregistration Transfer Logic ✓

**Resolution**: When removing a parent pulse, transfer all subs to the **largest child in the parent's subs array**.

- Example: Removing pulse 16 with subs [8, 4, 2] → transfer all to pulse 8
- If there are no children, the pulse wasn't a parent to begin with

### 5. findChild Array Mutation ✓

**Resolution**: Issue has been fixed to avoid mutating the sorted array.

### 6. Multiple Parents Scenario ✓

**Resolution**: When a pulse has multiple potential parents, assign it to the **largest parent**.

- Example: Pulse 4 with potential parents [16, 12, 8] → assign to 16
- This aligns with the priority given to larger step counts throughout the system

---

## Binary Search Optimization

The documentation mentions keeping leadPulses sorted for efficient lookups. Here's why:

**Purpose**: With leadPulses sorted in descending order, you can use binary search to find parent/child relationships in O(log n) time instead of O(n).

**Use Cases**:

1. **Finding Parents**: When registering a new pulse with steps=4, binary search can quickly find all pulses with steps > 4 that might be parents (divisible by 4)
2. **Finding Children**: When registering a pulse with steps=16, binary search can efficiently locate pulses with steps < 16 that might be children (16 divisible by them)

**Implementation Note**: While current implementation uses linear search, maintaining sorted order enables future optimization using `Array.prototype.findIndex()` with binary search algorithms, significantly improving performance with many lead pulses (100+).

---

## [UNCERTAIN] Areas Still Needing Clarification

No outstanding uncertainties at this time.

---

## Final Resolved Clarifications

### 7. Subs Structure ✓

**Resolution**: Use **flat structure** - all children directly in parent's subs array.

```typescript
pulse(32).subs = [16, 8, 4]; // All children stored as full Pulse objects
```

**Rationale**:
- Direct access to all subs from parent without traversal
- Subs are stored as full Pulse objects (not just references)
- May be simplified in future iterations

---

## Test Results & Findings

### Tests Created (12 tests, all passing ✓)

**Edge Cases (3 tests)**
- ✓ Register pulse with steps = 1 (divides everything)
- ✓ Register pulse with steps = 0 (edge case)
- ✓ Register very large prime numbers (no relationships)

**Duplicate Handling (4 tests)**
- ✓ Register same stepper multiple times, verify count increments
- ✓ Verify no duplicate pulses in elements array
- ✓ Verify no duplicate pulses in leadPulses array
- ✓ Count increments for both lead and non-lead pulses

**Complex Subdivision Chains (5 tests)**
- ✓ Register in ascending order: [2, 4, 8, 16, 32, 64]
- ✓ Register in descending order: [64, 32, 16, 8, 4, 2]
- ✓ Register in random order: [16, 4, 32, 2, 64, 8]
- ✓ Verify final structure is same regardless of order
- ✓ Deep chain maintains flat subs structure

### Implementation Issues Found

**1. Sort Function Bug** (src/components/Pulses.ts:94-96)

Current code:
```typescript
this.leadPulses.sort((a: Pulse, b: Pulse) => (a.steps > b.steps ? 0 : 1));
```

**Issue**: Returns `0` or `1` which doesn't properly sort descending.

**Fix**: Should return `-1` or `1`:
```typescript
this.leadPulses.sort((a: Pulse, b: Pulse) => (a.steps > b.steps ? -1 : 1));
```

**2. Missing Subs Transfer During Promotion**

When a new pulse becomes parent and demotes an existing lead:
- The demoted pulse's subs are cleared (via `clearSubs()`)
- But those subs are **not transferred** to the new parent
- This creates orphaned pulse relationships

**Expected behavior**: When pulse 64 is registered and demotes pulse 32:
```typescript
// Before: pulse(32) has subs [16, 8, 4]
// After: pulse(64) should have subs [32, 16, 8, 4]
// Currently: pulse(64) only gets [32], and [16, 8, 4] are lost
```

**Fix needed in register() method**: When adding new lead after finding child, transfer the child's subs:
```typescript
if (child) {
  const newPulse = new Pulse({ steps: stepper.steps });
  this.addLead(newPulse);

  // Transfer child's subs to new parent (flat structure)
  if (child.subs.length > 0) {
    child.subs.forEach(sub => newPulse.addSub(sub));
  }
  newPulse.addSub(child);

  this.demote(child);
  return;
}
```

---

## Test Suggestions (Beyond Documentation)

### Edge Cases

- [x] Register pulse with steps = 1 (divides everything)
- [x] Register pulse with steps = 0 (edge case)
- [x] Register very large prime numbers (no relationships) - using primes below 100
- [ ] Register negative numbers (should this be allowed?) => No (needs test)

### Duplicate Handling

- [x] Register same stepper multiple times, verify count increments correctly
- [x] Verify no duplicate pulses in elements array
- [x] Verify no duplicate pulses in leadPulses array
- [x] Count increments for both lead and non-lead pulses

### Complex Subdivision Chains

- [ ] Deep chain: 64 → 32 → 16 → 8 → 4 → 2 → 1 (partially tested)
- [x] Register in ascending order: [2, 4, 8, 16, 32, 64]
- [x] Register in descending order: [64, 32, 16, 8, 4, 2]
- [x] Register in random order: [16, 4, 32, 2, 64, 8]
- [x] Verify final structure is same regardless of order
- [x] Verify flat subs structure (all children in parent's subs)

### Unrelated Pulses

- [ ] Two prime numbers (e.g., 7 and 11)
- [ ] Numbers with GCD but neither parent/child (e.g., 12 and 18, GCD=6)
- [ ] Verify both become lead pulses
- [ ] Verify neither has subs

### Parent with Multiple Children

- [ ] Parent 16 with children [8, 4, 2]
- [ ] Verify all children in parent's subs
- [ ] Verify all children have lead=false

### One Child, Multiple Potential Parents

- [ ] Child 4 with potential parents [8, 12, 16, 20]
- [ ] Verify which parent is chosen
- [ ] Verify child only in one parent's subs

### Boundary Between Parent/Child

- [ ] Register 8, then 16 (16 should become parent)
- [ ] Register 16, then 8 (8 should become child)
- [ ] Verify relationship is established correctly

### Sort Stability

- [ ] After each registration, verify leadPulses remains sorted
- [ ] After promotion/demotion, verify sort order maintained
- [ ] Verify binary search assumptions hold (if used later)

### Deregistration (When Implemented)

- [ ] Deregister only stepper with a pulse → remove pulse entirely
- [ ] Deregister one of multiple steppers sharing pulse → decrement count
- [ ] Deregister parent pulse → verify subs transferred correctly
- [ ] Deregister child pulse → verify removed from parent's subs
- [ ] Deregister lead pulse with no children → verify simple removal

### State Invariants (Should Always Be True)

- [ ] `elements.length >= leadPulses.length`
- [ ] Every pulse in leadPulses has `lead === true`
- [ ] Every pulse in leadPulses is also in elements
- [ ] No pulse in elements appears twice
- [ ] leadPulses is sorted (ascending or descending - clarify first!)
- [ ] Non-lead pulses have empty subs array
- [ ] Lead pulses with children have non-empty subs
- [ ] Each child appears in exactly one parent's subs

### Performance/Stress Tests

- [ ] Register 100+ steppers with various subdivisions
- [ ] Verify performance stays reasonable
- [ ] Check for memory leaks with repeated register/deregister

---

## Mock Data Suggestions

### Simple Case

```typescript
// Register: [16]
// Expected: leadPulses: [16], elements: [16]
```

### Parent-Child Case

```typescript
// Register: [16, 4]
// Expected:
//   leadPulses: [16]
//   elements: [16, 4]
//   pulse(16).subs: [pulse(4)]
```

### Multiple Unrelated

```typescript
// Register: [7, 11, 13]
// Expected:
//   leadPulses: [7, 11, 13]
//   elements: [7, 11, 13]
//   All have empty subs
```

### Complex Chain

```typescript
// Register: [32, 16, 8, 4]
// Expected (depends on flat vs nested - see [UNCERTAIN] section above):
//   leadPulses: [32]
//   elements: [32, 16, 8, 4]
//   pulse(32).subs: [16, 8, 4] (flat) OR [16] (nested)
```
