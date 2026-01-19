import * as template1 from "../../public/templates/mamakossa.json";
import * as template2 from "../../public/templates/nottochaabi.json";

const mamakossa = template1;
const nottoochaabi = template2;

export type TemplateType = typeof mamakossa | typeof nottoochaabi;

interface Templates {
  [index: string]: TemplateType;
}

const templates: Templates = { mamakossa, nottoochaabi };

export default templates;
