import { Component, OnDestroy, OnInit } from "@angular/core";
import { AccountService, CoreService, State, CarrierContactDetails, FrequentlyAskedQuestion } from "@empowered/api";
import { CarrierContactType, CarrierContactTypeRank } from "@empowered/constants";
import { UserService } from "@empowered/user";
import { Subject, Subscription } from "rxjs";
import { mergeMap, takeUntil } from "rxjs/operators";
import { Location } from "@angular/common";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-frequently-asked-questions",
    templateUrl: "./frequently-asked-questions.component.html",
    styleUrls: ["./frequently-asked-questions.component.scss"],
})
export class FrequentlyAskedQuestionsComponent implements OnInit, OnDestroy {
    freqAskedQuestions: FrequentlyAskedQuestion[];
    carrierContactInfo: any[] = [];
    state: any;
    showSpinner: boolean;
    carrierIds: number[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.requestSupport.pageHeader",
        "primary.portal.requestSupport.faqTitle",
        "primary.portal.requestSupport.contactTitle",
        "primary.portal.common.back",
    ]);
    carrierContactType: CarrierContactType;
    groupSitusState: State;
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly accountService: AccountService,
        private readonly coreService: CoreService,
        private readonly language: LanguageService,
        private readonly user: UserService,
        private readonly location: Location,
    ) {}

    ngOnInit(): void {
        // FIXME - USE ASYNC PIPE IN TEMPLATE OR PIPABLE OPERATOR
        this.user.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((state) => {
            this.state = state;
        });
        this.getFrequentlyAskedQuestions();
        this.getAccountInfo();
    }
    /**
     * getFrequentlyAskedQuestions : function to get array data of FrequentlyAskedQuestion.
     * @returns void : void function returns nothing
     */
    getFrequentlyAskedQuestions(): void {
        this.showSpinner = true;
        this.accountService
            .getFrequentlyAskedQuestions()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((value) => {
                this.freqAskedQuestions = value;
                this.getCarrierList();
            });
    }

    getCarrierList(): void {
        this.showSpinner = true;
        this.accountService
            .getAccountCarriers(this.state.groupId)
            .pipe(mergeMap((carrier) => carrier.carriers))
            .pipe(mergeMap((carrier: any) => this.coreService.getCarrierContacts(carrier.carrier)))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((value) => {
                this.filterDataBasedOnContactTypeAndState(value);
            });
    }
    /**
     *@description will filter carrier contact details with contact type & state and sort filter contact list array
     *@param carrierContactDetailsList CarrierContactDetails
     */
    filterDataBasedOnContactTypeAndState(carrierContactDetailsList: CarrierContactDetails[]): void {
        const filterContactList = carrierContactDetailsList.filter((carrierContactDetails) => {
            if (CarrierContactType[carrierContactDetails.type]) {
                carrierContactDetails["rank"] = CarrierContactTypeRank[carrierContactDetails.type];
                return !("state" in carrierContactDetails)
                    ? carrierContactDetails
                    : JSON.stringify(carrierContactDetails.state) === JSON.stringify(this.groupSitusState)
                    ? carrierContactDetails
                    : null;
            }
            return undefined;
        });
        filterContactList.sort((a, b) => a.rank - b.rank);
        if (!this.carrierContactInfo.length) {
            this.carrierContactInfo.push(filterContactList);
        } else {
            const carrierContactIds = this.carrierContactInfo.filter((exist) => {
                const existingIds = exist.map((i) => i.id).sort();
                const newIds = filterContactList.map((a) => a.id).sort((a, b) => a - b);
                return JSON.stringify(existingIds) === JSON.stringify(newIds);
            });
            if (!carrierContactIds.length) {
                this.carrierContactInfo.push(filterContactList);
            }
        }
        this.showSpinner = false;
    }

    getAccountInfo(): void {
        this.accountService
            .getAccount(this.state.groupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((value) => {
                this.groupSitusState = value.situs.state;
            });
    }

    backClick(): void {
        this.location.back();
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
