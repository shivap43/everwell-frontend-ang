import { HttpResponse } from "@angular/common/http";
import { Configurations } from "@empowered/constants";
import { of } from "rxjs";

export const mockStaticService = {
    getConfigurations: (names: string, mpGroup?: number, partnerId?: string) =>
        of([{ name: "unplugged", value: "true" }] as Configurations[]),
    validateStateZip: (state: string, zip: string) => of({} as HttpResponse<void>),
    getStates: () => of([]),
    getCountries: () => of([]),
    getCounties: (event: string) => of([]),
    getSuffixes: () => of([]),
    getGenders: () => of(["male", "female", "others"]),
    getPhoneNumberTypes: () => of([]),
    getEmailTypes: () => of([]),
};
