import { Action, State, StateContext, Selector } from "@ngxs/store";
import { PendedBusinessModel } from "./pended-business.model";
import { AdminService } from "@empowered/api";
import { ProducerDetails, Admin } from "@empowered/constants";
import { UserService } from "@empowered/user";
import { SetAdmin, SetProducer } from "./pended-business.actions";
import { switchMap, tap } from "rxjs/operators";
import { Observable } from "rxjs";
import { Injectable } from "@angular/core";

@State<PendedBusinessModel>({
    name: "pendedBusiness",
    defaults: {
        admin: null,
        producer: null,
    },
})
@Injectable()
export class PendedBusinessState {
    constructor(private readonly adminService: AdminService, private readonly userService: UserService) {}
    @Selector()
    static getAdmin(state: PendedBusinessModel): Admin {
        return state.admin;
    }
    @Selector()
    static getProducer(state: PendedBusinessModel): ProducerDetails {
        return state.producer;
    }
    @Action(SetAdmin)
    setAdmin(context: StateContext<PendedBusinessModel>): Observable<Admin> {
        return this.userService.credential$.pipe(
            switchMap((credential) => this.adminService.getAdmin(credential["adminId"] || credential["producerId"])),
            tap((admin) => {
                context.patchState({
                    admin,
                });
            }),
        );
    }

    @Action(SetProducer)
    setProducer(context: StateContext<PendedBusinessModel>, payload: SetProducer): void {
        context.patchState({
            producer: payload.producer,
        });
    }
}
