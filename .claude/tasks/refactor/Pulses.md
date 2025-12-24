# Description:

- A pulse is an object that notifies steppers at a regular interval of time.
- The interval of time is a function of Pulse.steps, there must be only one Pulse per number of steps existing in the application. Eg: If there are 3 steppers of 8 steps, one Pulse of 8 steps (or size 8) must exist to notify these steppers
- We need a Datastrucutre to access pulses and to maintain information about existing pulses.
- The pulses class will interact directly with the steppers
- Multiple lifecycles events matter to the Pulses: STEPPER REGISTRATION, STEPPER UPDATE

# Requirements for a datastructure to hold pulses:

- A pulse will also know if other existing pulses are subdivisions of itself (number of steps).
- only the minimum number of pulses necessary are created at all times
- Each pulse has keeps the COUNT of how many steppers are currently listening to it
- A stepper can be updated (beats and stepsPerBeat), the Pulses datastructure MUST update itself accordingly
- If a stepper is created it must have a pulse to listen to. The pulses' size may be a factor of its number of steps (e.g : 8 can listen to 32)
- A child stepper can be created after a parent, and should listen to its parent and be easily identifiable via the parent Pulse itself
- A stepper update means a parent stepper's pulse may disappear. It should make the next appropriate pulse the lead, and the children pulses affected should subscribe to the parent.
- No matter the order of creation, parent or children or siblings at creation and update, the Pulses datastructure should enforce and reflect the current state of each steppers current source of truth.

# INSTRUCTIONS:

## PHASE 1 - Feedback:

- Comment these explanations and these requirements. Identifiy uncertainties with [UNCLEAR] and list and explain them, ask questions if needed

## PHASE 2 - Proposal:

- Explain the architecture that seems more apt to fulfill these requirement, and to be of good use in this application.

## PHASE 3 - Prototype:

- Propose Pulses and Pulse and if needed updates to stepper. Create all necessary files inside of /src/components/experimental. Write typescript directly with comments.
