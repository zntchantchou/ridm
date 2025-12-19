## [TASK] TEST DELETION OF A STEPPER AND ITS IMPACT ON PULSES IN DIFFERENT CASES

## Pulse is lead - no subs:

- [ ] DELETE THE PULSE from Pulses
- [ ] cleanup any pulse's emitting observable
- [ ] unsubscribe the stepper from this pulse
- [ ] DELETE THE stepper from steppers array
- [ ] DELETES THE stepper from the ui

## Pulse is not lead:

- [ ] Decrement the pulse by one
- [ ] unsubscribe the stepper from the pulse
- [ ] delete the stepper from the steppers array
- [ ] DELETES THE stepper from the ui

## Pulse lead with subs:

- [ ] NEXT BIGGEST SUBPULSE BY STEPS MUST BE PROMOTED TO LEAD
- [ ] NEXT BIGGEST SUBPULSE BY STEPS MUST BE TRANSFERRED SUBS FROM PREVIOUS LEAD
- [ ] PARENT SUBPULSES MUST BE RESET TO ITS EMPTY STATE (PART OF DEMOTING)
- [ ] PARENT PULSE IS DELETED FROM THE PULSES LEADS ARRAY AND PULSES ELEMENTS ARRAY
- [ ] STEPPER MUST BE DELETED IN THE STEPPERS ARRAY TOO
- [ ] DELETES THE stepper from the ui
