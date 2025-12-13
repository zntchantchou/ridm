import Controls from "./components/Controls";
import Stepper from "./components/Stepper";
import Timerworker from "./worker/Timerworker";

Controls.init();
Timerworker.init();

const getTotalSteps = (subdivisions: number) => subdivisions * 4;
// const stepperA = new Stepper({ steps: getTotalSteps(8) });
const stepperB = new Stepper({ steps: getTotalSteps(4) });
// const stepperC = new Stepper({ steps: getTotalSteps(3) });
// const stepperD = new Stepper({ steps: getTotalSteps(2) });
// const stepperE = new Stepper({ steps: getTotalSteps(1) });
// const stepperF = new Stepper({ steps: getTotalSteps(30) });
// stepperA.render();
stepperB.render();
// stepperC.render();
// stepperD.render();
// stepperE.render();
// stepperF.render();
