# Test Task: Pulse Creation

Update Pulse.test.ts and Pulses.test.ts as needed.

## Task Checklist

Test scenarios based on the Pulses.register() method functionality:

- [ ] 1. registers stepper to empty Pulses correctly
- [ ] 2. registers stepper to existing pulse with same steps
- [ ] 3. registers child pulse when parent exists
- [ ] 4. registers parent pulse when child exists and reassigns subs
- [ ] 5. registers many unrelated pulses correctly
- [ ] 6. maintains leadPulses sorted descending by steps
- [ ] 7. updates pulse count when registering to existing pulse
- [ ] 8. reassigns steppers to new parent when parent pulse added

## File Structure Modifications

### BEFORE

```
(No test files exist yet)
```

### AFTER

```
src/components/__tests__/Pulses.test.ts (new file with 8 test cases)
```

## Code Analysis

Analyzed the stepper reassignment logic in src/components/Pulses.ts:40-60 (child registration path):

**When a parent pulse is registered and a child exists:**

1. New parent pulse is created and promoted to lead
2. Child's subs are transferred to the new parent (lines 46-50)
3. Child is demoted and becomes a sub of the new parent (lines 51-52)
4. **Critical reassignment logic (lines 53-58):** All steppers belonging to the subs are found via `steppers.filter()` and reassigned to listen to the new parent pulse via `stepper.listenToPulse(newPulse)`

**Verdict:** The logic is correct. The code properly reassigns all affected steppers to the new parent pulse when the hierarchy changes. Test case 8 should create a sequence that validates this reassignment happens correctly.

## Notes

- Tests focus on the Pulses.register() method which handles pulse creation and management
- Each test scenario validates different registration paths (empty, existing, parent, child, unrelated)
- Test names are numbered for easy selection with jest -t flag
- Test case 8 should verify stepper reassignment by creating children first, then adding a parent, and checking that steppers now listen to the parent

## Stepper Test Ideas (for future test task)

1. **listenToPulse unsubscribes previous subscription** - verify that subscribing to a new pulse properly unsubscribes from the old one (Stepper.ts:34)
2. **filterStep with matching pulse** - stepper with 16 steps listening to 16-step pulse should filter correctly
3. **filterStep with parent pulse** - stepper with 8 steps listening to 16-step pulse should only trigger on divisible steps (0, 2, 4, 6, etc.)
4. **toggleStep updates selectedSteps array** - verify toggling updates the boolean array correctly
5. **toggleStep updates DOM dataset** - verify data-selected attribute switches between "on" and "off"
6. **multiple steppers listen to same pulse** - verify multiple steppers can subscribe to one pulse without interference
7. **resubscription during pulse hierarchy change** - verify stepper correctly switches from child to parent pulse when hierarchy changes
