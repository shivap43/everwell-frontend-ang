import { ActionRequired } from "./index";
import { Credential } from "@empowered/constants";

export interface LoginResponse {
    user: Credential;
    actionRequired?: ActionRequired[];
}
