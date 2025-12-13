// choose what classes to create based on the tasks to be done

- Create the Sequencer
- Display the first stepper (row of steps or subdivisions)
- Start the browser animation loop
- Set the frequency of incoming messages from the web worker
- Update the visual cue for the active currently active step on all steppers
- Create the web worker for scheduling with regularity
- Handle message from the web worker
- Wait for next subdivision
- Move to the next subdivision or wrap to 0
- Update the number of subdivisions
- Queue the next active subdivision for Steppers to pick-up and display
- Determine if the next note should be played
- Set off the next note and specify the exact time when to play it
- Load wav samples from disk

UI Components

- Controls

  - select all input elements
  - handle value updates and hoist to state

- Stepper
  - Display a row of steps
  - Lights up the currently active step as a visual cue
  - Has its own number of total steps
  - calculate the width of its steps based on their number
