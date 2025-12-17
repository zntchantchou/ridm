# Pulses and Subdivisions

Pulses store all collections pertaining to Pulse
Pulses must be efficient, and keep as little leadPulses as possible because these will be performing heavy computations.
However subPulses depend on leadPulses so their management is important.
We try to keep leadPulses as a SORTED structure at all times to look for children and parents efficiently.

## Technical constraints:

- Elements must contain all registered pulses , lead and non-lead.
- LeadPulses must only contains Pulses such that Pulse.lead = true.
- There should never be a duplicate of a pulse in elements or leadPulses. The criteria for uniqueness is the steps of the Pulse. Of course a pulse can be in both elements and leadPulses.
- mock data can be generated to verify sequences of events and the correct state of the elements, leadPulses and all pulses
- test sequences of event such as registering steppers with ascending number of steps
- test sequences of event such as registering steppers with descending number of steps
- If step a is being registered, the could for this existing duplicate should be updated to account for it
- A pulse is a child of another if its totalSteps are a subdivision of one of the leadPulses steps. For example 4 is a child of 16.
- A pulse is a parent of another if its steps are a factor of one of the leadPulses steps. For example 14 is a parent of 7.
- Pulses that are neither a parent or a child and are not present in the elements of the pulse must be added as a standard Pulse at register.
- The code must ensure that a Pulse that is a Parent has subs
- The code must ensure that a Pulse that is a child has no subs
- When pulses deregisters a child Pulse, it must be removed from its parent Pulse subs
- When pulses deregisters a parent Pulse, all of its subs must be passed down to its child pulse with the most steps
- Pulses must always keep the lead pulses in order

## More Explanations for testing

- Steppers and Pulse class can be imported
- For the purpose of the tests, two pulses are duplicates if they have the same number of steps
