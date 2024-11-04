import { Observable } from "rxjs";
import { SettingsDropdownName } from "@empowered/constants";

export interface SettingsDropdownMeta {
    name: SettingsDropdownName;
    class: string;

    trigger: {
        label?: string;
        value: Observable<string>;
    };

    backdrop: {
        anchor: HTMLElement;
        style: string;
    };

    portal: {
        class: string;
        title: string;
    };

    footer: {
        reset: string;
        apply: string;
    };
}
