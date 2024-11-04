import { Admin } from "@empowered/constants";

export interface Comment {
    readonly id?: number;
    text: string;
    readonly createAdmin?: Admin;
    readonly createdOn?: Date;
    readonly updateOn?: Date;
}
