# functionalities to implement

The stepper control component is one of the elements that, when clicked, update the currently selected stepper.
They must call the appropriate method from state to notify this stepper/track selection.
Up to now this was handle using direct dom element selection via a javascript event listener and its handler inside components/SoundPanel.ts.

Once this is implemented, the SoundPanel should have it's fillColor updated to reflect the color of the selected stepper as per the State class which stores the state.
