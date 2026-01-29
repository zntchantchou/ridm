import mamakossa from "../templates/mamakossa.json";
import nottoochaabi from "../templates/nottochaabi.json";
import initial from "../templates/initial.json";

export type TemplateType =
  | typeof mamakossa
  | typeof nottoochaabi
  | typeof initial;

interface Templates {
  [index: string]: TemplateType;
}

const templates: Templates = {
  mamakossa,
  nottoochaabi,
  initial,
};

export default templates;
