import { Contraints } from "./contraints.model";
import { Or } from "./or.model";

export interface And {
    constraints: Contraints[];
    or: Or;
}
