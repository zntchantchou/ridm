# Scope of the test: HANDLE UPDATE OF A STEPPER's BEAT OR STEPSPERBEATS AND ITS IMPACT ON PULSES IN DIFFERENT CASES

In each case we are handle a Stepper's stepsPerBeat of beats property being updated.
This is happening in Sequencer via change events on number inputs
We want to make sure the Pulse are managed logically. There are always a constant number of steppers, right now 8.
We want steppers updates to trigger the correct state management functions for Pulses.count and Pulses elements and leadPulses to
reflect the current state of the application
Mark any uncertainties in the task's checklist as [UNCERTAIN]

## Scenario 1: Pulse listened to by stepper is a lead pulse - it has no subs:

- unsubscribe THE STEPPER from the pulses' BehaviourSubject
- if the pulse's is not listened to by any stepper DELETE THE PULSE from Pulses (deregister)

## Scenario 2 : Pulse listened to by stepper is not a lead pulse :

- Decrement the pulse's count by one, deleting it from pulses (elements and leadPulses) if its count is 0
- unsubscribe the stepper from the pulse (unsubscribe)
- clear the subject emitting from the pulse // if necessary

## Scenario 3: Pulse is a lead and has subs and 0 steppers are listening anymore:

- NEXT BIGGEST SUBPULSE BY STEPS MUST BE PROMOTED TO LEAD
- NEXT BIGGEST SUBPULSE BY STEPS MUST BE TRANSFERRED SUBS FROM PREVIOUS LEAD
- PARENT PULSE IS DELETED FROM THE PULSES LEADS ARRAY AND PULSES ELEMENTS ARRAY
