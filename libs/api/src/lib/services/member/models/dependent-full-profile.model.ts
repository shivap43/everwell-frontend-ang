import { Name, Gender } from "@empowered/constants";
import { DependentContact } from "./member-dependent-contact.model";

export interface DependentFullProfile {
    id: number;
    name: Name;
    contact: DependentContact;
    gender: Gender;
    dependentRelationId: number;
    birthDate: string;
    state: string;
}
