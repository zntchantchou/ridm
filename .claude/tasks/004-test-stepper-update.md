# Test stepper updates and pulse management

Test that updating a stepper's beats or stepsPerBeat properties correctly manages Pulses state including count, elements, leadPulses, and subscriptions.

## Task checklist

- [ ] 1. update stepper count on existing pulse decrements count
- [ ] 2. pulse with count 1 is deleted when stepper deregisters
- [ ] 3. pulse with count > 1 is kept when one stepper deregisters
- [ ] 4. lead pulse with no subs is deleted when last stepper deregisters
- [ ] 5. lead pulse with subs promotes first sub when deleted
- [ ] 6. stepper unsubscribes from old pulse when updating
- [ ] 7. stepper subscribes to new pulse after update
- [ ] 8. updating stepper to existing pulse increments count
- [ ] 9. rapid succession updates handled correctly (deregister-register cycle)
- [ ] 10. pulse elements and leadPulses arrays stay synchronized

## Promotion logic confirmed

The `deregister()` implementation (Pulses.ts:61-84) now handles Scenario 3:

**Lines 63-73:** When a pulse has subs AND count === 1 (last stepper deregistering):
1. Takes first sub as successor
2. Promotes successor to lead via `addLead()`
3. Transfers remaining subs to successor
4. Demotes original pulse

This matches the guidelines requirement: "NEXT BIGGEST SUBPULSE BY STEPS MUST BE PROMOTED TO LEAD"

## File structure modifications

### BEFORE

```
src/components/
  Pulses.test.ts (175 lines)
  Sequencer.ts (no tests)
```

### AFTER

```
src/components/
  Pulses.test.ts (175 lines - existing)
  Pulses.deregister.test.ts (new - stepper update tests)
```

## Notes

- Tests will focus on the deregister-update-register cycle that happens in `Sequencer.handleBeatsUpdate` and `Sequencer.handleStepsPerBeatUpdate`
- The current implementation always calls deregister before updating, then register after
- Task 9 clarification: "Rapid succession" refers to testing the deregister-register cycle in a loop or multiple updates in quick sequence programmatically, not actual simultaneous user clicks
