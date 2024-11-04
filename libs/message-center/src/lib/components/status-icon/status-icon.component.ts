import { Component, Input } from "@angular/core";
import { BehaviorSubject, Observable, defer, iif } from "rxjs";
import { switchMap, map } from "rxjs/operators";
import { AdminStatus } from "@empowered/api";
import { PortalType } from "@empowered/constants";

@Component({
  selector: "empowered-status-icon",
  templateUrl: "./status-icon.component.html",
  styleUrls: ["./status-icon.component.scss"]
})
export class StatusIconComponent {

  private readonly _portalType$: BehaviorSubject<string> = new BehaviorSubject<string>(undefined);
  @Input() set portalType (newPortal: string) {
    this._portalType$.next(newPortal);
  }

  private readonly _lastReadOn$: BehaviorSubject<string> = new BehaviorSubject<string>(undefined);
  @Input() set lastReadOn (lastReadOn: string) {
    this._lastReadOn$.next(lastReadOn);
  }

  private readonly _status$: BehaviorSubject<AdminStatus> = new BehaviorSubject<AdminStatus>(undefined);
  @Input() set status (status: AdminStatus) {
    this._status$.next(status);
  }

  /**
   * Convert the inputs into the appropriate icon
   */
  dotIcon$: Observable<string> = this._portalType$.pipe(
      map(portalType => portalType.toUpperCase()),
      switchMap(portalType => iif(
          () => portalType === PortalType.ADMIN,
          defer(() => this._status$.asObservable().pipe(
              map(status => {
                  if (status === "NEW") {
                    return "circle";
                  }
                  if (status === "CLOSED") {
                    return "circle-outline";
                  }
                  return undefined;
                })
            )),
          defer(() => this._lastReadOn$.asObservable().pipe(
              map(lastReadOn => !Boolean(lastReadOn) ? undefined : "circle")
            ))
        ))
    );
}
