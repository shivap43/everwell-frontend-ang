import { Csrf } from "@empowered/api";
import { of } from "rxjs";
export const mockCsrfService = {
    load: () => of({} as Csrf),
};
