import Controls from "./components/Controls";
import Stepper from "./components/Stepper";

Controls.init();
const stepperA = new Stepper({ steps: 32 });
const stepperB = new Stepper({ steps: 16 });
const stepperC = new Stepper({ steps: 8 });
const stepperD = new Stepper({ steps: 4 });
const stepperE = new Stepper({ steps: 3 });
const stepperF = new Stepper({ steps: 40 });
stepperA.render();
stepperB.render();
stepperC.render();
stepperD.render();
stepperE.render();
stepperF.render();
