import { Component, OnDestroy } from "@angular/core";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { ActivatedRoute, Router } from "@angular/router";
import { Store } from "@ngxs/store";
import { Subscription } from "rxjs";
import { TPIState } from "@empowered/ngxs-store";
import { TpiSSOModel } from "@empowered/constants";
import { AddressMatchingService } from "@empowered/common-services";
enum AddressMatchingSteps {
    AGENT_OR_ACCOUNT = "AGENT_OR_ACCOUNT",
    RELATIVE_TO_AGENT = "RELATIVE_TO_AGENT",
    UPDATE_ADDRESS = "UPDATE_ADDRESS",
    MATCHED_ADDRESS_ALLOWED = "MATCHED_ADDRESS_ALLOWED",
}
@Component({
    selector: "empowered-address-matching",
    templateUrl: "./address-matching.component.html",
    styleUrls: ["./address-matching.component.scss"],
})
export class AddressMatchingComponent implements OnDestroy {
    mpGroup = "";
    memberId = "";
    addressMatchingSteps = AddressMatchingSteps;
    currentStep = AddressMatchingSteps.AGENT_OR_ACCOUNT;
    isAgent = false;
    isRelatedToAgent = false;
    isSpinnerLoading = false;
    subscriptions: Subscription[] = [];
    tpiSsoDetail: TpiSSOModel;
    isAgentAssisted = false;

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly addressMatchingService: AddressMatchingService,
        private readonly store: Store,
    ) {
        this.memberId = this.route.snapshot.params.memberId;
        this.mpGroup = this.route.snapshot.params.mpGroupId;
        this.tpiSsoDetail = this.store.selectSnapshot(TPIState.tpiSsoDetail);
        if (this.tpiSsoDetail.user.producerId || this.store.selectSnapshot(TPIState.getTPIProducerId)) {
            this.isAgentAssisted = true;
        }
    }

    /**
     * actions to take on click of back button
     */
    back(): void {
        if (this.currentStep === AddressMatchingSteps.RELATIVE_TO_AGENT) {
            this.currentStep = AddressMatchingSteps.AGENT_OR_ACCOUNT;
        } else if (
            this.currentStep === AddressMatchingSteps.UPDATE_ADDRESS ||
            this.currentStep === AddressMatchingSteps.MATCHED_ADDRESS_ALLOWED
        ) {
            this.currentStep = this.isAgent ? AddressMatchingSteps.AGENT_OR_ACCOUNT : AddressMatchingSteps.RELATIVE_TO_AGENT;
        } else {
            this.router.navigate(["tpi/shop"], { queryParams: { review: true } });
        }
    }

    /**
     * actions on click of next/continue button
     */
    next(): void {
        if (this.currentStep === AddressMatchingSteps.RELATIVE_TO_AGENT) {
            this.currentStep = this.isRelatedToAgent ? AddressMatchingSteps.MATCHED_ADDRESS_ALLOWED : AddressMatchingSteps.UPDATE_ADDRESS;
        } else if (this.currentStep === AddressMatchingSteps.UPDATE_ADDRESS) {
            this.isSpinnerLoading = true;
            // saveAccountContactOrAccountProducerConfirmation api flag set to false on not updating address
            this.subscriptions.push(
                this.addressMatchingService.saveAccountContactOrAccountProducerConfirmation(+this.mpGroup, +this.memberId, false).subscribe(
                    () => {
                        this.isSpinnerLoading = false;
                        this.router.navigate([`tpi/app-flow/${this.mpGroup}/${this.memberId}`]);
                    },
                    () => (this.isSpinnerLoading = false),
                ),
            );
        } else if (this.currentStep === AddressMatchingSteps.MATCHED_ADDRESS_ALLOWED) {
            this.saveData();
        } else {
            this.currentStep = this.isAgent ? AddressMatchingSteps.MATCHED_ADDRESS_ALLOWED : AddressMatchingSteps.RELATIVE_TO_AGENT;
        }
    }

    /**
     * set value of isAgent according to change in value of checkbox
     * @param event
     */
    onChangeAgent(event: MatCheckboxChange): void {
        this.isAgent = event.checked;
        this.isRelatedToAgent = this.isAgent ? !this.isAgent : this.isRelatedToAgent;
    }

    /**
     * set values of isRelatedToAgent according to change in value of checkbox
     * @param event
     */
    onChangeRelated(event: MatCheckboxChange): void {
        this.isRelatedToAgent = event.checked;
        this.isAgent = this.isRelatedToAgent ? !this.isRelatedToAgent : this.isAgent;
    }

    /**
     * saves the decision of applicant on click of continue
     */
    saveData(): void {
        this.isSpinnerLoading = true;
        if (this.isRelatedToAgent || this.isAgent) {
            this.subscriptions.push(
                this.addressMatchingService
                    .saveAccountContactOrAccountProducerConfirmation(+this.mpGroup, +this.memberId, true)
                    .subscribe(() => {
                        this.isSpinnerLoading = false;
                        this.router.navigate([`tpi/app-flow/${this.mpGroup}/${this.memberId}`]);
                    }),
            );
        }
    }
    /**
     * Function called on click of 'Exit' button and is used to exit from TPI flow
     */
    onExit(): void {
        this.router.navigate(["tpi/exit"]);
    }
    /**
     * on destroy of component
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
}
