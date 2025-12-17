import Controls from "./components/Controls";
import Stepper from "./components/Stepper";
import Timerworker from "./worker/Timerworker";
import Sequencer from "./components/Sequencer";
import Audio from "./components/Audio";
import Pulses from "./components/Pulses";

window.addEventListener("load", init);
const playBtn = document.getElementById("play");
playBtn?.addEventListener("click", () => {
  Timerworker.start();
});

function init() {
  Controls.init();
  Audio.init();
  const getTotalSteps = (subdivisions: number) => subdivisions * 4;
  // Sequencer.register(new Stepper({ steps: getTotalSteps(2) }));
  // Sequencer.register(new Stepper({ steps: getTotalSteps(4) }));
  // Sequencer.register(new Stepper({ steps: getTotalSteps(8) }));
  const pulses = new Pulses();
  const sequencer = new Sequencer(pulses);
  sequencer.register(new Stepper({ steps: getTotalSteps(4) }));
  sequencer.register(new Stepper({ steps: getTotalSteps(7) }));
  sequencer.register(new Stepper({ steps: getTotalSteps(9) }));
  // Sequencer.register(new Stepper({ steps: getTotalSteps(16) }));
}
