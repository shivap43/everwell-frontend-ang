import { VerificationMethod } from "./verificationMethod.model";

export interface MaskedVerification {
    type: VerificationMethod;
    value: string;
}
