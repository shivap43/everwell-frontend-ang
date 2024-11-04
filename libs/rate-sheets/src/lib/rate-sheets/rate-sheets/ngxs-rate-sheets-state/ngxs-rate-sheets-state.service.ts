import { Injectable } from "@angular/core";
import { CountryState } from "@empowered/constants";
import {
    AdminPreference,
    RestictedConfigurations,
    SetAdminPreference,
    SetQuoteLevelData,
    SetRestrictedConfiguration,
    SettingsData,
    UniversalQuoteState,
} from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { Observable } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class NGXSRateSheetsStateService {
    constructor(private readonly store: Store) {}

    /**
     * Gets admin preference
     * @returns admin preference
     */
    getAdminPreference(): Observable<AdminPreference[]> {
        return this.store.select(UniversalQuoteState.GetAdminPreferences);
    }

    /**
     * Sets admin preference
     * @param adminId of the admin whose preference needs to be set
     * @returns admin preference
     */
    setAdminPreference(adminId: number): Observable<[CountryState[], AdminPreference[]]> {
        return this.store.dispatch(new SetAdminPreference(adminId));
    }

    /**
     * Sets quote level data
     * @returns quote level data
     */
    setQuoteLevelData(): Observable<any> {
        return this.store.dispatch(new SetQuoteLevelData());
    }

    /**
     * Sets restricted configuration
     * @returns restricted configuration
     */
    setRestrictedConfiguration(): Observable<any> {
        return this.store.dispatch(new SetRestrictedConfiguration());
    }

    /**
     * Gets level settings data
     * @returns level settings
     */
    getLevelSettings(): Observable<SettingsData> {
        return this.store.select(UniversalQuoteState.GetLevelSettings);
    }

    /**
     * Gets channels
     * @returns channels
     */
    getChannels(): Observable<string[]> {
        return this.store.select(UniversalQuoteState.GetChannels);
    }

    /**
     * Gets configurations
     * @returns configurations
     */
    getConfigurations(): Observable<RestictedConfigurations[]> {
        return this.store.select(UniversalQuoteState.GetConfigurations);
    }
}
