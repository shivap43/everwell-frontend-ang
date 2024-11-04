import { Injectable, Inject } from "@angular/core";
import { LOCALE_CONFIG, DefaultLocaleConfig, LocaleConfig } from "./daterangepicker.config";

@Injectable()
export class LocaleService {
    constructor(@Inject(LOCALE_CONFIG) private localeConfig: LocaleConfig) {}

    get config() {
        if (!this.localeConfig) {
            return DefaultLocaleConfig;
        }

        return { ...DefaultLocaleConfig, ...this.localeConfig };
    }
}
