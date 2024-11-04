import { FooterAction, SettingsDropdownName } from "@empowered/constants";

export interface SettingsDropdownState {
    active?: SettingsDropdownName | null;
    footer: {
        footerAction: FooterAction | null;
    };
}
