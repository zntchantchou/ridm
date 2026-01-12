# Description

The application needs to save the state of the effects and the state of the steppers to localstorage.
The main benefit is that it will allow the user that returns to the app to find the sequencer programmed the same as they left it before reloading or leaving the page.
We do not wish to save the currentStep, we only want the effects, along with the steppers steps, beats and selected size to be persisted.

# Architecture

Follow the example in State.ts, where you can see State relies on observables to receive updates from different components after use interactions

# How to execute and check for approval

Take a look at Pulses.ts, Pulse.ts and Stepper.ts to understand the logic before starting implementation.
Ask before moving from one task to the next and tick each task when valided by me

# Include these tasks in this order first

- [] implement a method in State so that the selectedSteps array of a stepper (in state) is updated, add the needed rxjs code too
- [] Propose an architecture of the objects we will have in localstorage, basically give me the object shapes and what access and update may look like in code. Write this inside of this directory in a file name 'storage.proposal.md'
- [] Add a settings property in the state as well as in the state stored in localstorage. In the same fashion, an observable needs to
  handle the TPC being updated, and the general volume being updated. These events happen in the Controls singleton.

[UNCERTAIN] "selected size" terminology

I did mean selectedSteps and not selected size. the size is the factor of beats and steps so I was mistaken.

[UNCERTAIN] When to save to localStorage

The saves must take place when any of the settings in the state is updated, effects or steppers parameters. Do implement what is needed so that quick user interaction are only triggered as you suggested. No manual saving.

[UNCERTAIN] When to load from localStorage

For now do not load from localstorage, just implement initializing it with default values and then updating it.
If it exists, you will update it, if it does not exist, you will initialize.

[UNCERTAIN] Effect serialization

Omit the node themselves, we will create them and pass them their values. The other properties in the Effect type from src/state/state.types.ts will be used by the Audio module to create the effects.

[UNCERTAIN] First task scope
Task 1 says: "implement a method in State so that the selectedSteps array of a stepper (in state) is updated, add the needed rxjs code too"

Currently, selectedSteps are updated directly in Stepper.ts:197-202 (the toggleStep method). Questions:

- Should this new method also persist to localStorage immediately?
- Or is this task purely about establishing the observable communication pattern between Stepper and State? Yes it is.
- Should Stepper.toggleStep emit to a State subject, which then updates the state and triggers localStorage save?
  FEEDBACK: Yes we want to notify state of the change using the observable from State. this way the state will handle updating itself, and then updating storage. Each will be encapsulated properly to provide an elegant chaining solution with rxjs.

Please clarify these uncertainties so I can proceed with the implementation accurately.
