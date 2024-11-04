import { Params, ActivatedRoute, NavigationExtras } from "@angular/router";
import { of, Subject } from "rxjs";

export const mockRouter = {
    url: "",
    navigate: (commands: any[], extras?: NavigationExtras) => Promise.resolve(true),
    events: of(""),
};
const mockRouteParams = new Subject<Params>();

const mockActivatedRoute = {
    params: mockRouteParams.asObservable(),
} as ActivatedRoute;
