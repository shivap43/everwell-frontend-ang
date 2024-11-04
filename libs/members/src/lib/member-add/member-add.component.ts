import { Component, HostListener, OnInit, ViewChild, AfterViewInit, OnDestroy } from "@angular/core";
import { MatTab, MatTabGroup, MatTabHeader } from "@angular/material/tabs";
import { ActivatedRoute, Router } from "@angular/router";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { StaticService, MemberService, MemberQualifier, MemberQualifierValidity } from "@empowered/api";
import { ConfigName, ContactType, MemberProfile } from "@empowered/constants";
import { SharedService } from "@empowered/common-services";
import { UserService } from "@empowered/user";
import { Store, Select } from "@ngxs/store";
import { Observable, Subject, Subscription, combineLatest, iif, of } from "rxjs";
import { ContactInfoComponent } from "./contact-info/contact-info.component";
import { PersonalInfoComponent } from "./personal-info/personal-info.component";
import { WorkInfoComponent } from "./work-info/work-info.component";
import { map, switchMap, takeUntil, tap } from "rxjs/operators";
import { AddMemberInfo, AddMemberValidators, MemberInfoState, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { MemberAddTabs } from "@empowered/constants";

const PROSPECT = "prospect";
const MP_GROUP_ID = "mpGroupId";
const PROSPECT_ID = "prospectId";

@Component({
    selector: "empowered-member-add",
    templateUrl: "./member-add.component.html",
    styleUrls: ["./member-add.component.scss"],
})
export class MemberAddComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly MemberAddTabs: typeof MemberAddTabs = MemberAddTabs;
    type: string = MemberAddTabs.PERSONAL;
    isTestEmployee: boolean;
    actionTaken: string;
    portal: string;
    memberId: number;
    mpGroupId: number;
    disableWork = true;
    disableContact = true;
    @ViewChild("tabs", { static: true }) tabs: MatTabGroup;
    @ViewChild(PersonalInfoComponent) personalInfo: PersonalInfoComponent;
    @ViewChild(WorkInfoComponent) workInfo: WorkInfoComponent;
    @ViewChild(ContactInfoComponent) contactInfo: ContactInfoComponent;
    @Select(MemberInfoState.getMemberInfo) member$: Observable<MemberProfile>;
    navLinks = [
        { label: MemberAddTabs.PERSONAL, id: 1 },
        { label: MemberAddTabs.WORK, id: 2 },
        { label: MemberAddTabs.CONTACT, id: 3 },
    ];
    languageStrings: Record<string, string>;
    editProfileModel;
    isMember: boolean;
    isDirect: boolean;
    isLoading: boolean;
    dismissEmailQualifierId: number;
    emailAlertDismissed$: Observable<boolean>;
    emailOnFile$: Observable<boolean>;
    stronglyRecommendEmailConfig$: Observable<boolean> = this.staticUtilService.cacheConfigEnabled(ConfigName.STRONGLY_RECOMMEND_EMAIL);
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    isEmployerNameFieldEnabled = false;
    isEmployerNameFieldReadOnly = true;

    constructor(
        private readonly store: Store,
        private readonly staticService: StaticService,
        private readonly router: Router,
        private readonly memberService: MemberService,
        private readonly user: UserService,
        private readonly language: LanguageService,
        private readonly activatedRoute: ActivatedRoute,
        private readonly sharedService: SharedService,
        private readonly staticUtilService: StaticUtilService,
    ) {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
    }

    /**
     * This is the initial function that gets executed in this component
     * Method is used to get member details and other configurations
     */
    ngOnInit(): void {
        this.isDirect = false;
        this.portal = this.store.selectSnapshot(SharedState.portal);
        iif(
            () => this.router.url.includes(PROSPECT),
            this.activatedRoute.parent.parent.parent.parent.params.pipe(
                tap((data) => (this.mpGroupId = data.prospectId)),
                switchMap(() => this.activatedRoute.parent.parent.params),
            ),
            this.activatedRoute.parent.parent.params,
        )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((params) => {
                const tabId = this.activatedRoute.snapshot.queryParams["tabId"]
                    ? parseInt(this.activatedRoute.snapshot.queryParams["tabId"], 10)
                    : undefined;
                if ((this.mpGroupId || MP_GROUP_ID in params || PROSPECT_ID in params) && "memberId" in params) {
                    // Case of normal employee
                    this.isDirect = false;
                    this.memberId = +params["memberId"];
                    if (params[PROSPECT_ID]) {
                        this.mpGroupId = +params[PROSPECT_ID];
                    } else {
                        this.mpGroupId = +params[MP_GROUP_ID] ? +params[MP_GROUP_ID] : this.mpGroupId;
                    }
                    this.setMemberIdinState();
                    this.getMemberDetails(tabId);
                } else if ((this.mpGroupId || MP_GROUP_ID in params) && "customerId" in params) {
                    // Case of direct employee
                    this.isDirect = true;
                    this.mpGroupId = +params[MP_GROUP_ID] ? +params[MP_GROUP_ID] : this.mpGroupId;
                    this.memberId = +params["customerId"];
                    this.setMemberIdinState();
                    this.getMemberDetails(tabId);
                }
            });
        combineLatest([this.user.credential$, this.sharedService.userPortal$])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([credential, portal]) => {
                this.isMember = portal.type === "member";
                const tabId = this.activatedRoute.snapshot.queryParams["tabId"]
                    ? parseInt(this.activatedRoute.snapshot.queryParams["tabId"], 10)
                    : undefined;
                if (this.isMember && "memberId" in credential) {
                    this.memberId = credential.memberId;
                    this.mpGroupId = credential.groupId;
                    this.isDirect = false;
                    this.getMemberDetails(tabId);
                }
            });

        this.staticService
            .getConfigurations("portal.member.form.*.*", this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                const validatorsVal = { personal: [], work: [], contact: [] };
                Response.forEach((element) => {
                    if (element.name.split(".")[3] === MemberAddTabs.PERSONAL) {
                        validatorsVal.personal.push(element);
                    } else if (element.name.split(".")[3] === MemberAddTabs.WORK) {
                        validatorsVal.work.push(element);
                    } else if (element.name.split(".")[3] === MemberAddTabs.CONTACT) {
                        validatorsVal.contact.push(element);
                    }
                });
                this.store.dispatch(new AddMemberValidators(validatorsVal));
            });

        this.getLanguageStrings();
        this.displayEmailAlert();
        this.sharedService
            .isEmployerNameFieldEnabled(this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([isEmployerNameFieldEnabled, isEmployerNameFieldReadOnly]) => {
                this.isEmployerNameFieldEnabled = isEmployerNameFieldEnabled;
                this.isEmployerNameFieldReadOnly = isEmployerNameFieldReadOnly;
            });
    }

    /**
     * get the selected member details
     * @param tabId selected tabId from route
     */
    getMemberDetails(tabId: number): void {
        if (tabId) {
            this.isLoading = true;
            this.fetchMemberData(tabId);
        } else if (!this.isDirect) {
            const member: any = {
                memberInfo: {},
                activeMemberId: this.memberId,
                mpGroupId: this.mpGroupId,
            };
            this.store.dispatch(new AddMemberInfo(member));
            if (this.memberId) {
                this.checkTermination();
            }
        } else if (this.isDirect && this.memberId) {
            this.checkTermination();
        }
    }

    /**
     * fetch selected member details and load member data
     * @param tabId selected tabId from route
     */
    fetchMemberData(tabId?: number): void {
        this.memberService
            .getMember(this.memberId, true, this.mpGroupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                this.editProfileModel = result.body;
                this.isLoading = false;
                if (tabId) {
                    this.loadMemberData(this.memberId, tabId);
                }
            });
    }

    setMemberIdinState(): void {
        const member: any = {
            memberInfo: {},
            activeMemberId: this.memberId,
            mpGroupId: this.mpGroupId,
        };
        this.store.dispatch(new AddMemberInfo(member));
        if (this.memberId) {
            this.checkTermination();
        }
    }

    ngAfterViewInit(): void {
        // eslint-disable-next-line no-underscore-dangle
        this.tabs._handleClick = this.interceptTabChange.bind(this);
    }

    getLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.member.terminate.heading",
            "primary.portal.common.cancel",
            "primary.portal.member.rehire.column",
            "primary.portal.member.editterminate.column",
            "primary.portal.member.rehire.content",
            "primary.portal.member.terminate.gridtermination",
            "primary.portal.member.testText",
            "primary.portal.common.encourageEmailAddress",
            "primary.portal.common.customer",
            "primary.portal.common.employee",
        ]);
        if (this.isDirect) {
            this.languageStrings["primary.portal.common.encourageEmailAddress"] = this.languageStrings[
                "primary.portal.common.encourageEmailAddress"
            ].replace("##employee##", this.languageStrings["primary.portal.common.customer"]);
        } else {
            this.languageStrings["primary.portal.common.encourageEmailAddress"] = this.languageStrings[
                "primary.portal.common.encourageEmailAddress"
            ].replace("##employee##", this.languageStrings["primary.portal.common.employee"]);
        }
    }

    /**
     * loading contact info for a member if we're going to Contact tab directly
     * @param memberId
     */
    loadMemberData(memberId: number, tab?: number): void {
        this.memberService
            .getMemberContact(memberId, ContactType.HOME, this.mpGroupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                const data: any = result.body;
                data.address["address2"] = data.address.address2 ? data.address.address2 : null;
                data.address["city"] = data.address.city ? data.address.city : null;
                data.address["countyId"] = data.address.countyId ? data.address.countyId.toString() : null;
                data.address["country"] = data.address.country ? data.address.country : null;
                const editAddressModel = data.address;
                const editObject = { ...this.editProfileModel, ...{ address: editAddressModel } };
                const workInfo = { ...editObject.workInformation };
                workInfo["payrollFrequencyId"] = editObject.workInformation.payrollFrequencyId
                    ? editObject.workInformation.payrollFrequencyId.toString()
                    : undefined;
                workInfo["organizationId"] = editObject.workInformation.organizationId
                    ? editObject.workInformation.organizationId.toString()
                    : undefined;
                editObject.workInformation = { ...workInfo };
                if (editObject.workInformation.termination && Object.entries(editObject.workInformation.termination).length !== 0) {
                    const termination = { ...editObject.workInformation.termination };
                    termination["terminationCodeId"] = editObject.workInformation.termination.terminationCodeId
                        ? editObject.workInformation.termination.terminationCodeId.toString()
                        : undefined;
                    editObject.workInformation.termination = { ...termination };
                }
                if (editObject.profile.correspondenceLocation === undefined) {
                    editObject.profile["correspondenceLocation"] = ContactType.HOME;
                }
                if (tab && tab === 1) {
                    this.fetchWorkContactData(editObject, memberId);
                }
                this.store.dispatch(
                    new AddMemberInfo({
                        memberInfo: editObject,
                        activeMemberId: memberId,
                        mpGroupId: this.mpGroupId,
                    }),
                );

                const tabId = tab ? tab : this.activatedRoute.snapshot.queryParams["tabId"];
                if (tabId !== undefined) {
                    this.tabs.selectedIndex = tabId;
                    switch (tabId) {
                        case "0":
                            this.type = MemberAddTabs.PERSONAL;
                            break;
                        case "1":
                            this.type = MemberAddTabs.WORK;
                            break;
                        case "2":
                            this.type = MemberAddTabs.CONTACT;
                            break;
                    }
                }
            });
    }

    fetchWorkContactData(editObject: any, memberId: number): void {
        this.memberService
            .getMemberContact(memberId, ContactType.WORK, this.mpGroupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                editObject = { ...this.editProfileModel, ...{ workAddress: Response.body } };
                this.enableContact(true);
                this.store.dispatch(
                    new AddMemberInfo({
                        memberInfo: editObject,
                        activeMemberId: memberId,
                        mpGroupId: this.mpGroupId,
                    }),
                );
                this.workInfo.editMemberDataSync(memberId);
            });
    }

    interceptTabChange(tab: MatTab, tabHeader: MatTabHeader, idx: number): any {
        // eslint-disable-next-line prefer-rest-params
        const args = arguments;
        if (this.personalInfo && this.personalInfo.regiForm.dirty) {
            this.personalInfo.allowNavigation = new Subject<boolean>();
            this.personalInfo.openAlert();
            this.personalInfo.allowNavigation.pipe(takeUntil(this.unsubscribe$)).subscribe(
                // eslint-disable-next-line no-underscore-dangle
                (res) => res && MatTabGroup.prototype._handleClick.apply(this.tabs, args),
            );
        } else if (this.workInfo && this.workInfo.memberWorkForm.dirty) {
            this.workInfo.allowNavigation = new Subject<boolean>();
            this.workInfo.getStateManagement();
            this.workInfo.openAlert();
            this.workInfo.allowNavigation.pipe(takeUntil(this.unsubscribe$)).subscribe(
                // eslint-disable-next-line no-underscore-dangle
                (res) => res && MatTabGroup.prototype._handleClick.apply(this.tabs, args),
            );
        } else if (this.contactInfo && this.contactInfo.memberContactForm.dirty) {
            this.contactInfo.allowNavigation = new Subject<boolean>();
            this.contactInfo.openAlert();
            this.contactInfo.allowNavigation.pipe(takeUntil(this.unsubscribe$)).subscribe(
                // eslint-disable-next-line no-underscore-dangle
                (res) => res && MatTabGroup.prototype._handleClick.apply(this.tabs, args),
            );
        } else {
            // eslint-disable-next-line no-underscore-dangle
            return MatTabGroup.prototype._handleClick.apply(this.tabs, args);
        }
    }

    showTab(id: any): void {
        id = id.index;
        if (id === 0) {
            this.type = MemberAddTabs.PERSONAL;
        } else if (id === 1) {
            this.type = MemberAddTabs.WORK;
        } else {
            this.type = MemberAddTabs.CONTACT;
        }
    }

    enableAll(data: boolean): void {
        this.disableWork = false;
        this.disableContact = false;
    }

    enableWork(data: boolean): void {
        this.disableWork = false;
        this.disableContact = true;
    }

    enableContact(data: boolean): void {
        this.disableContact = false;
    }

    @HostListener("window:beforeunload")
    canDeactivate(): Observable<boolean> | boolean {
        if (this.personalInfo && this.personalInfo.regiForm.dirty) {
            this.personalInfo.allowNavigation = new Subject<boolean>();
            this.personalInfo.openAlert();
            return this.personalInfo.allowNavigation.asObservable();
        }
        if (this.workInfo && this.workInfo.memberWorkForm.dirty) {
            this.workInfo.allowNavigation = new Subject<boolean>();
            this.workInfo.openAlert();
            return this.workInfo.allowNavigation.asObservable();
        }
        if (this.contactInfo && this.contactInfo.memberContactForm.dirty) {
            this.contactInfo.allowNavigation = new Subject<boolean>();
            this.contactInfo.openAlert();
            return this.contactInfo.allowNavigation.asObservable();
        }
        return true;
    }

    checkTermination(): void {
        this.memberService
            .getMember(this.memberId, true, this.mpGroupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                this.isTestEmployee = result.body && result.body.profile ? result.body.profile.test : false;
            });
    }

    /**
     * Check if email alert should display
     */
    displayEmailAlert(): void {
        // Check in db if email alert dismissed previously
        this.emailAlertDismissed$ = this.memberService.getMemberQualifierTypes().pipe(
            map((qualifierTypes) => qualifierTypes.filter((qualifierType) => qualifierType.qualifierCode === "DISMISS_EMAIL")[0]),
            switchMap((dismissEmailQualifierType) => {
                this.dismissEmailQualifierId = dismissEmailQualifierType.id;
                return this.memberService.getMemberQualifier(this.memberId, this.mpGroupId.toString(), this.dismissEmailQualifierId);
            }),
            map((dismissEmailQualifier) => (dismissEmailQualifier.length ? true : false)),
        );
        // Check if member has email on file
        this.emailOnFile$ = this.member$.pipe(map((member) => !!member.verificationInformation?.verifiedEmail));
    }

    /**
     * When email alert is dismissed, make api call
     */
    dismissEmailAlert(): void {
        const req: MemberQualifier = {
            value: "true",
            validity: { effectiveStarting: new Date().toJSON().slice(0, 10) } as MemberQualifierValidity,
        };
        this.memberService
            .saveMemberQualifier(this.memberId, this.mpGroupId.toString(), this.dismissEmailQualifierId, req)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
