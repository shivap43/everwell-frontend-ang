import { Injectable } from "@angular/core";
import { StaticUtilService } from "@empowered/ngxs-store";

export interface AflacAlwaysConfig {
    deductionFrequencies: string[];
}
@Injectable({
    providedIn: "root",
})
export class AflacAlwaysConfigService {
    protected readonly configKeys: Record<keyof AflacAlwaysConfig, unknown>;

    private temp: Record<string, unknown> = {
        deductionFrequencies: ["Monthly", "Quarterly"],
    };

    constructor(private readonly config: StaticUtilService) {
        this.configKeys = this.buildConfigKeys();
    }

    /**
     * @description Gets a proxy object that provides access to language strings based on property names.
     * @returns {Proxy} - A proxy object that provides access to strings based on property names.
     * @memberof EnrollAflacAlwaysLanguageService
     */
    get strings(): AflacAlwaysConfig {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        return new Proxy(Object.create(null), {
            get(_, prop: string) {
                if (typeof prop !== "string") {
                    return undefined;
                }

                if (Object.prototype.hasOwnProperty.call(self.temp, prop)) {
                    return self.temp[prop];
                }

                if (Object.prototype.hasOwnProperty.call(self.configKeys, prop)) {
                    return self.config.cacheConfigValue(self.configKeys[prop]);
                }

                return undefined;
            },
        });
    }

    /**
     * @description Builds the config keys
     * @returns Record<keyof AflacAlwaysConfig, string>
     */
    protected buildConfigKeys(): Record<keyof AflacAlwaysConfig, string> {
        return {
            deductionFrequencies: "general.feature.aflacAlways.allowedPayFrequencies",
        };
    }
}
