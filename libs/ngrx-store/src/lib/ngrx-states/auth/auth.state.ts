import { AsyncData, AsyncStatus, Credential } from "@empowered/constants";

export interface State {
    user: AsyncData<Credential | null>;
}

export const initialState: State = {
    user: {
        status: AsyncStatus.IDLE,
    },
};
