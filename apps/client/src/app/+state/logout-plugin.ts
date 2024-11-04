import { getActionTypeFromInstance, NgxsNextPluginFn } from "@ngxs/store";
import { UtilNavLogout } from "@empowered/ngxs-store";

export function logoutPlugin(state: any, action: any, next: NgxsNextPluginFn): NgxsNextPluginFn {
    // Use the get action type helper to determine the type
    if (getActionTypeFromInstance(action) === UtilNavLogout.type) {
        // If we are a logout type, lets erase all the state and resets app / user objects to empty
        return next(
            {
                EnrollmentMethodState: {},
                Member: {},
                accountInfo: {},
                accounts: {},
                app: {},
                core: {},
                language: state.language,
                login: {},
                router: {},
                user: {},
            },
            action,
        );
    }
    // return the next function with the empty state
    return next(state, action);
}
