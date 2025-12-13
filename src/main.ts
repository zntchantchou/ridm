import Controls from "./components/Controls";
import Stepper from "./components/Stepper";
import Timerworker from "./worker/Timerworker";
import Sequencer from "./components/Sequencer";

window.addEventListener("load", init);

function init() {
  Controls.init();
  Timerworker.init();
  const getTotalSteps = (subdivisions: number) => subdivisions * 4;
  const defaultStepper = new Stepper({ steps: getTotalSteps(4) });
  const seq = new Sequencer(Timerworker);
  seq.register(defaultStepper);
}
