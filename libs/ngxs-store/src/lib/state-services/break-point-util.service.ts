import { Injectable } from "@angular/core";
import { BreakpointObserver } from "@angular/cdk/layout";
import { combineLatest, Observable } from "rxjs";
import { map, distinctUntilChanged, filter } from "rxjs/operators";
import { BreakpointSizes } from "@empowered/constants";

/**
 * Media Breakpoints as defined in ZeroHeight:
 * XS: < 576
 * SM: >= 576
 * MD: >= 768
 * LG: >= 992
 * XL: >= 1200
 */
const XS_SIZE_BREAKPOINT = "(max-width: 575px)";
const SM_SIZE_BREAKPOINT = "(min-width: 576px) and (max-width: 767px)";
const MD_SIZE_BREAKPOINT = "(min-width: 768px) and (max-width: 991px)";
const LG_SIZE_BREAKPOINT = "(min-width: 992px) and (max-width: 1199px)";
const XL_SIZE_BREAKPOINT = "(min-width: 1200px)";

const BREAKPOINT_TO_SIZE_MAP: Map<string, BreakpointSizes> = new Map()
    .set(XS_SIZE_BREAKPOINT, BreakpointSizes.XS)
    .set(SM_SIZE_BREAKPOINT, BreakpointSizes.SM)
    .set(MD_SIZE_BREAKPOINT, BreakpointSizes.MD)
    .set(LG_SIZE_BREAKPOINT, BreakpointSizes.LG)
    .set(XL_SIZE_BREAKPOINT, BreakpointSizes.XL);

const PORTRAIT_ORIENTATION_BREAKPOINT = "(orientation: portrait)";
const LANDSCAPE_ORIENTATION_BREAKPOINT = "(orientation: landscape)";

export type ScreenOrientation = "PORTRAIT" | "LANDSCAPE";

const ORIENTATION_TO_LAYOUT_MAP: Map<string, ScreenOrientation> = new Map()
    .set(PORTRAIT_ORIENTATION_BREAKPOINT, "PORTRAIT")
    .set(LANDSCAPE_ORIENTATION_BREAKPOINT, "LANDSCAPE");

export interface BreakpointData {
    size: BreakpointSizes;
    orientation: ScreenOrientation;
}

@Injectable({
    providedIn: "root",
})
export class BreakPointUtilService {
    breakpointObserver$: Observable<BreakpointData> = combineLatest(
        this.breakpointObserver
            .observe([XS_SIZE_BREAKPOINT, SM_SIZE_BREAKPOINT, MD_SIZE_BREAKPOINT, LG_SIZE_BREAKPOINT, XL_SIZE_BREAKPOINT])
            .pipe(filter((breakpoints) => breakpoints.matches)),
        this.breakpointObserver
            .observe([PORTRAIT_ORIENTATION_BREAKPOINT, LANDSCAPE_ORIENTATION_BREAKPOINT])
            .pipe(filter((orientations) => orientations.matches)),
    ).pipe(
        map(([breakpoints, orientations]) => {
            // Find the screen size from the breakpoints
            let breakpoint: BreakpointSizes;
            Object.keys(breakpoints.breakpoints).forEach((key) => {
                if (breakpoints.breakpoints[key]) {
                    breakpoint = BREAKPOINT_TO_SIZE_MAP.get(key);
                }
            });

            // Find the orientation from the breakpoints
            let orientation: ScreenOrientation;
            Object.keys(orientations.breakpoints).forEach((key) => {
                if (orientations.breakpoints[key]) {
                    orientation = ORIENTATION_TO_LAYOUT_MAP.get(key);
                }
            });
            return {
                size: breakpoint,
                orientation: orientation,
            };
        }),
        distinctUntilChanged(
            (prevBreakpoint, currBreakpoint) =>
                prevBreakpoint.size === currBreakpoint.size && prevBreakpoint.orientation === currBreakpoint.orientation,
        ),
    );

    constructor(private breakpointObserver: BreakpointObserver) {}
}
