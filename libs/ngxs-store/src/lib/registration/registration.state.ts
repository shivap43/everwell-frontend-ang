import { Name, MemberProfile, Relations, MemberDependent, MemberContact } from "@empowered/constants";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import {
    GetCsrf,
    SetAdminId,
    SetContactForm,
    SetDependents,
    SetEmail,
    SetGroupId,
    SetRegistrationMemberId,
    SetPersonalForm,
    SetPhone,
    SetProducerId,
    SetRelations,
    SetName,
    SetUserName,
    SetMultipleAccountMode,
} from "./registration.actions";
import { RegistrationStateModel } from "./registration.model";
import { ResetState } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";

const defaultState: RegistrationStateModel = {
    email: null,
    phone: null,
    memberId: null,
    groupId: null,
    adminId: null,
    producerId: null,
    userType: null,
    personalForm: null,
    contactForm: null,
    relations: null,
    dependents: null,
    userName: null,
    accountUserName: null,
    multipleAccountMode: false,
};

@State<RegistrationStateModel>({
    name: "RegistrationState",
    defaults: defaultState,
})
@Injectable()
export class RegistrationState {
    constructor() {}

    @Selector()
    static groupId(state: RegistrationStateModel): number {
        return state.groupId;
    }

    @Selector()
    static dependents(state: RegistrationStateModel): MemberDependent[] {
        return state.dependents;
    }

    @Selector()
    static adminId(state: RegistrationStateModel): number {
        return state.adminId;
    }

    @Selector()
    static memberId(state: RegistrationStateModel): number {
        return state.memberId;
    }

    @Selector()
    static producerId(state: RegistrationStateModel): number {
        return state.producerId;
    }

    @Selector()
    static email(state: RegistrationStateModel): string {
        return state.email;
    }

    @Selector()
    static phone(state: RegistrationStateModel): string {
        return state.phone;
    }

    @Selector()
    static userName(state: RegistrationStateModel): Name {
        return state.userName;
    }
    @Selector()
    static accountUserName(state: RegistrationStateModel): string {
        return state.accountUserName;
    }

    @Selector()
    static personalForm(state: RegistrationStateModel): MemberProfile {
        return state.personalForm;
    }

    @Selector()
    static contactForm(state: RegistrationStateModel): MemberContact {
        return state.contactForm;
    }

    @Selector()
    static relations(state: RegistrationStateModel, id: number): Relations[] {
        return state.relations;
    }
    @Selector()
    static getMultipleAccountMode(state: RegistrationStateModel): boolean {
        return state.multipleAccountMode;
    }

    @Action(ResetState)
    resetState(context: StateContext<RegistrationStateModel>): void {
        context.setState(defaultState);
    }

    @Action(SetGroupId)
    setGroupId({ patchState }: StateContext<RegistrationStateModel>, { groupId }: SetGroupId): void {
        patchState({
            groupId: groupId,
        });
    }

    @Action(SetRegistrationMemberId)
    setMemberId({ patchState }: StateContext<RegistrationStateModel>, { memberId }: SetRegistrationMemberId): void {
        patchState({
            memberId: memberId,
            userType: "MEMBER",
        });
    }

    @Action(SetEmail)
    email({ patchState }: StateContext<RegistrationStateModel>, { email }: SetEmail): void {
        patchState({
            email: email,
        });
    }
    @Action(SetName)
    Name({ patchState }: StateContext<RegistrationStateModel>, { name }: SetName): void {
        patchState({
            userName: name,
        });
    }

    @Action(SetPhone)
    phone({ patchState }: StateContext<RegistrationStateModel>, { phone }: SetPhone): void {
        patchState({
            phone: phone,
        });
    }

    @Action(SetAdminId)
    setAdminId({ patchState }: StateContext<RegistrationStateModel>, { adminId }: SetAdminId): void {
        patchState({
            adminId: adminId,
            userType: "ADMIN",
        });
    }

    @Action(SetProducerId)
    setProducerId({ patchState }: StateContext<RegistrationStateModel>, { producerId }: SetProducerId): void {
        patchState({
            producerId: producerId,
            userType: "PRODUCER",
        });
    }

    @Action(SetPersonalForm)
    setPersonalForm({ patchState }: StateContext<RegistrationStateModel>, { personalForm }: SetPersonalForm): void {
        patchState({
            personalForm: personalForm,
        });
    }

    @Action(SetContactForm)
    setContactForm({ patchState }: StateContext<RegistrationStateModel>, { contactForm }: SetContactForm): void {
        patchState({
            contactForm: contactForm,
        });
    }

    @Action(GetCsrf)
    getSelectorFn(): void {
        // FIXME - This is not the proper way to set CSRF
        // this.csrf.load();
    }

    @Action(SetRelations)
    setRelations({ patchState }: StateContext<RegistrationStateModel>, { relations }: SetRelations): void {
        patchState({
            relations: relations,
        });
    }

    @Action(SetDependents)
    SetDependnets({ patchState }: StateContext<RegistrationStateModel>, { dependents }: SetDependents): void {
        patchState({
            dependents: dependents,
        });
    }
    @Action(SetUserName)
    SetUserName({ patchState }: StateContext<RegistrationStateModel>, { userName }: SetUserName): void {
        patchState({
            accountUserName: userName,
        });
    }
    /**
     * Sets multipleAccountMode that indicates whether a member is a part of multiple accounts
     * If multipleAccountMode is true and the member is not registered in one of their accounts,
     * then the registration process varies slightly.
     * @param object that has a multipleAccountMode boolean field
     * @returns nothing
     */
    @Action(SetMultipleAccountMode)
    setMultipleAccountMode({ patchState }: StateContext<RegistrationStateModel>, { multipleAccountMode }: SetMultipleAccountMode): void {
        patchState({ multipleAccountMode });
    }
}
