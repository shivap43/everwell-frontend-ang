// eslint-disable-next-line max-classes-per-file
import { Credential } from "@empowered/constants";

export class SetUserCredential {
    static readonly type = "[User] Set Credential";

    constructor(public credential: Credential) {}
}

export class ResetState {
    static readonly type = "[User] ResetState";
}
