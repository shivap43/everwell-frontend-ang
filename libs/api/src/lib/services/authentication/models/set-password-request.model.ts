export interface SetPasswordRequest {
    token: string;
    password: string;
    mfaPreferred: boolean;
}
