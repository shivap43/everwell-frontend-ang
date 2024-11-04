import { ActivatedRoute, Params, UrlSegment } from "@angular/router";
import { BehaviorSubject } from "rxjs";

const mockRouteParams = new BehaviorSubject<Params>({
    memberId: 1,
    groupId: 12345,
    guid: "guid12345",
    isSuccess: 1,
    mpGroupId: 123,
});
export const mockActivatedRoute = {
    queryParams: mockRouteParams.asObservable(),
    parent: { parent: { params: mockRouteParams.asObservable() } },
    snapshot: {
        url: [{ path: "test1" }, { path: "test2" }, { path: "test3" }] as UrlSegment[],
        params: mockRouteParams.asObservable() as unknown,
    },
} as ActivatedRoute;
