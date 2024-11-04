import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { CommissionSplit, RULE_CONSTANT, State, StaticService, AflacService, CoreService, Carrier, AccountService } from "@empowered/api";
import { CompanyCode, WritingNumber, AccountProducer, Product } from "@empowered/constants";
import { Store } from "@ngxs/store";
import { CommissionsState } from "@empowered/ngxs-store";
import { Subscription, forkJoin } from "rxjs";
import { flatMap } from "rxjs/operators";
import { CommissionSplitsService } from "../commission-splits/commission-splits.service";

interface DialogData {
    isSameProducer: boolean;
    existingCommissionSplit: CommissionSplit;
    newCommissionSplit: CommissionSplit;
}

interface RulesList {
    type: RULE_CONSTANT;
    name: string;
}

interface RulesObject {
    [RULE_CONSTANT.WRITING_PRODUCER]: string[];
    [RULE_CONSTANT.PRODUCT]: string[];
    [RULE_CONSTANT.STATES]: string[];
    [RULE_CONSTANT.DATE_WRITTEN]: string[];
    [RULE_CONSTANT.CARRIER]: string[];
    [RULE_CONSTANT.ENROLLMENT_METHOD]: string[];
}

@Component({
    selector: "empowered-duplicate-split-found",
    templateUrl: "./duplicate-split-found.component.html",
    styleUrls: ["./duplicate-split-found.component.scss"],
})
export class DuplicateSplitFoundComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.commissions.duplicateSplit.createdCommissionsSplit",
        "primary.portal.commissions.duplicateSplit.appliedWhen",
        "primary.portal.commissions.duplicateSplit.dontReplace",
        "primary.portal.commissions.duplicateSplit.duplicateSplitFound",
        "primary.portal.commissions.duplicateSplit.enrollmentMethod",
        "primary.portal.commissions.duplicateSplit.existingSplit",
        "primary.portal.commissions.duplicateSplit.gotIt",
        "primary.portal.commissions.duplicateSplit.name",
        "primary.portal.commissions.duplicateSplit.owner",
        "primary.portal.commissions.duplicateSplit.replace",
        "primary.portal.commissions.duplicateSplit.split",
        "primary.portal.commissions.duplicateSplit.haveCommissionsSplit",
        "primary.portal.commissionSplit.addUpdate.ruleWritingProducer",
        "primary.portal.commissionSplit.addUpdate.ruleProduct",
        "primary.portal.commissionSplit.addUpdate.ruleState",
        "primary.portal.commissionSplit.addUpdate.ruleDate",
        "primary.portal.commissionSplit.addUpdate.ruleCarrier",
        "primary.portal.commissionSplit.addUpdate.ruleEnrollMethod",
        "primary.portal.common.and",
        "primary.portal.commissionSplit.commission.anyExcept",
        "primary.portal.common.or",
        "primary.portal.tpi.partialCensus.equalTo",
        "primary.portal.setPrices.percentage",
        "primary.portal.commissions.duplicateSplit.defaultCommissionSplit",
    ]);

    isSpinnerLoading = false;
    rulesList: RulesList[] = [];
    stateList: State[] = [];
    mpGroupId: number;
    ownerName: string;
    productList: Product[] = [];
    carrierList: Carrier[] = [];
    subscriptions: Subscription[] = [];
    innerHTML: string;
    producerList: AccountProducer[] = [];
    allWritingNumbers: WritingNumber[] = [];
    rulesObj: RulesObject;
    writingProducer = RULE_CONSTANT.WRITING_PRODUCER;
    product = RULE_CONSTANT.PRODUCT;
    states = RULE_CONSTANT.STATES;
    dateWritten = RULE_CONSTANT.DATE_WRITTEN;
    carrier = RULE_CONSTANT.CARRIER;
    enrollmentMethod = RULE_CONSTANT.ENROLLMENT_METHOD;
    OR = "primary.portal.common.or";
    EQUALS = "primary.portal.tpi.partialCensus.equalTo";
    PERCENTAGE = "primary.portal.setPrices.percentage";
    writingProducerRule: string;
    writingProducerValue: string[] = [];
    productRule: string;
    productValue: string[] = [];
    stateRule: string;
    stateValue: string[] = [];
    dateWrittenRule: string;
    dateWrittenValue: string[] = [];
    careerRule: string;
    careerValue: string[] = [];
    enrollmentMethodRule: string;
    enrollmentMethodValue: string[] = [];
    writingProducerLength = 0;
    productLength = 0;
    statesLength = 0;
    dateWrittenLength = 0;
    careerLength = 0;
    enrollmentMethodLength = 0;
    assignmentsString: string[] = [];
    isDefaultDuplicate = false;
    constructor(
        private readonly language: LanguageService,
        private readonly staticService: StaticService,
        @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
        private readonly dialogRef: MatDialogRef<DuplicateSplitFoundComponent>,
        private readonly store: Store,
        private readonly aflac: AflacService,
        private readonly coreService: CoreService,
        private readonly accountService: AccountService,
        private readonly commissionSplitsService: CommissionSplitsService,
    ) {}

    /**
     * This is the initial function that gets executed in this component
     * It initialized the forms and loads the lists
     * @returns void
     */
    ngOnInit(): void {
        this.mpGroupId = this.store.selectSnapshot(CommissionsState.groupId);
        this.isDefaultDuplicate = this.data.existingCommissionSplit.defaultFor !== undefined;
        this.loadRulesList();
        this.initiateSubscriptions();
    }

    /**
     * function is used to get the assignment values of the commission split
     * @returns void
     */
    getAssignmentsList(): void {
        this.data.existingCommissionSplit.assignments.forEach((assign) => {
            const percent = assign.percent;
            const name = assign.producer.name;
            const sitCode = this.getSitCodeBySitCodeIdProducerId(assign.producer.producerId.toString(), assign.sitCodeId);
            const writingNumber = this.getWritingNumberBySitCode(assign.producer.producerId.toString(), assign.sitCodeId);
            const assignmentString = `${percent}${this.languageStrings[this.PERCENTAGE]}  ${name}  ${sitCode}  ${writingNumber}`;
            this.assignmentsString.push(assignmentString);
            const ownerProducer = this.getProducer(this.data.existingCommissionSplit.createdById);
            this.ownerName = ownerProducer.producer
                ? `${ownerProducer.producer.name.firstName} ${ownerProducer.producer.name.lastName}`
                : " ";
        });
    }

    /** function to initialize subscription and add values to lists
     * @returns void
     */
    initiateSubscriptions(): void {
        this.isSpinnerLoading = true;
        this.subscriptions.push(
            forkJoin([
                this.coreService.getProducts(),
                this.coreService.getCarriers(),
                this.staticService.getStates(),
                this.accountService.getAccountProducers(this.mpGroupId.toString()),
            ]).subscribe((response) => {
                const PRODUCT_LIST_INDEX = 0;
                const CAREER_LIST_INDEX = 1;
                const STATE_LIST_INDEX = 2;
                const PRODUCER_LIST_INDEX = 3;
                this.productList = response[PRODUCT_LIST_INDEX];
                this.carrierList = response[CAREER_LIST_INDEX];
                this.stateList = response[STATE_LIST_INDEX];
                this.producerList = response[PRODUCER_LIST_INDEX];
                this.isSpinnerLoading = false;
                this.getAssignmentsList();
                this.getRuleDisplayList(this.data.existingCommissionSplit);
            }),
        );
    }

    /**
     * this function returns a producer object wrt passed producerId
     * @param producerId: number, producerId
     * @returns AccountProducer, returns AccountProducer object
     */
    getProducer(producerId: number): AccountProducer {
        return this.producerList.length ? this.producerList.find((x) => x.producer.id === producerId) : null;
    }

    /**
     * this function returns sit codes wrt to passed producerId and SitCodeId
     * @param producerId: string, producerId
     * @param sitCodeId: number, sitCodeId
     * @returns string, sitCode's code value
     */
    getSitCodeBySitCodeIdProducerId(producerId: string, sitCodeId: number): string {
        let code: string;
        if (producerId && producerId !== "" && sitCodeId && this.producerList) {
            const producerItem = this.getProducer(parseFloat(producerId));
            if (producerItem && producerItem.producer.writingNumbers.length > 0) {
                producerItem.producer.writingNumbers.forEach((item) => {
                    const sitCodeObj = item.sitCodes.find((x) => x.id === sitCodeId);
                    if (sitCodeObj) {
                        code = sitCodeObj.code;
                    }
                });
            }
        }
        return code || "";
    }

    /**
     * this function returns writing number wrt to passed producerId and sitCodeId
     * @param producerId: string, producerId
     * @param sitCodeId: number, sitCodeId
     * @returns writing number, writing number's number value
     */
    getWritingNumberBySitCode(producerId: string, sitCodeId: number): string {
        let num: string;
        if (producerId && producerId !== "" && sitCodeId && this.producerList) {
            const producer = this.getProducer(parseFloat(producerId));
            if (producer && producer.producer.writingNumbers.length > 0) {
                producer.producer.writingNumbers.forEach((item) => {
                    if (item.sitCodes.find((x) => x.id === sitCodeId)) {
                        num = item.number;
                    }
                });
            }
        }
        return num || "";
    }

    /**
     * function called to display all the rules related data in the popup
     * @param commissionSplit: CommissionSplit, the duplicate commission split
     * @returns void
     */
    getRuleDisplayList(commissionSplit: CommissionSplit): void {
        this.rulesObj = this.getRulesObject(commissionSplit);
        this.getInnerHTML(commissionSplit.splitCompanyCode);
    }

    /**
     * get the inner HTML wrt rules object and split company code
     * @param splitCompanyCode: string, split company code
     * @returns string, the inner html code
     */
    getInnerHTML(splitCompanyCode: string): void {
        if (this.rulesObj[RULE_CONSTANT.WRITING_PRODUCER].length > 0) {
            this.writingProducerRule = this.getRuleDisplayText(RULE_CONSTANT.WRITING_PRODUCER);
            this.writingProducerValue = this.rulesObj[RULE_CONSTANT.WRITING_PRODUCER];
        }
        if (this.rulesObj[RULE_CONSTANT.PRODUCT].length > 0) {
            this.productRule = this.getRuleDisplayText(RULE_CONSTANT.PRODUCT);
            this.productValue = this.rulesObj[RULE_CONSTANT.PRODUCT];
        }
        if (this.rulesObj[RULE_CONSTANT.STATES].length > 0) {
            this.stateRule = this.getRuleDisplayText(RULE_CONSTANT.STATES);
            if (splitCompanyCode === CompanyCode.NY) {
                this.stateValue.push(this.getDisplayTextOfStates(CompanyCode.NY));
            } else {
                this.stateValue = this.rulesObj[RULE_CONSTANT.STATES];
            }
        }
        this.getOtherText();
    }

    /**
     * sets the rules string values
     * @returns void
     */
    getOtherText(): void {
        if (this.rulesObj[RULE_CONSTANT.DATE_WRITTEN].length > 0) {
            this.dateWrittenRule = this.getRuleDisplayText(RULE_CONSTANT.DATE_WRITTEN);
            this.dateWrittenValue = this.rulesObj[RULE_CONSTANT.DATE_WRITTEN];
        }
        if (this.rulesObj[RULE_CONSTANT.CARRIER].length > 0) {
            this.careerRule = this.getRuleDisplayText(RULE_CONSTANT.CARRIER);
            this.careerValue = this.rulesObj[RULE_CONSTANT.CARRIER];
        }
        if (this.rulesObj[RULE_CONSTANT.ENROLLMENT_METHOD].length > 0) {
            this.enrollmentMethodRule = this.getRuleDisplayText(RULE_CONSTANT.ENROLLMENT_METHOD);
            this.enrollmentMethodValue = this.rulesObj[RULE_CONSTANT.ENROLLMENT_METHOD];
        }
    }

    /**
     * function to initialize rules object
     * @param commissionSplit: CommissionSplit, commission split object
     * @returns RulesObject, the rules object
     */
    getRulesObject(commissionSplit: CommissionSplit): RulesObject {
        const rulesObj: RulesObject = {
            [RULE_CONSTANT.WRITING_PRODUCER]: [],
            [RULE_CONSTANT.PRODUCT]: [],
            [RULE_CONSTANT.STATES]: [],
            [RULE_CONSTANT.DATE_WRITTEN]: [],
            [RULE_CONSTANT.CARRIER]: [],
            [RULE_CONSTANT.ENROLLMENT_METHOD]: [],
        };

        commissionSplit.rules.forEach((item) => {
            let producerObj;
            if (item.type === RULE_CONSTANT.WRITING_PRODUCER) {
                producerObj = this.getProducer(item.producerId);
            }
            switch (item.type) {
                case RULE_CONSTANT.WRITING_PRODUCER:
                    if (producerObj) {
                        rulesObj[RULE_CONSTANT.WRITING_PRODUCER].push(
                            `${producerObj.producer.name.firstName} ${producerObj.producer.name.lastName}`,
                        );
                    }
                    this.writingProducerLength += 1;
                    break;
                case RULE_CONSTANT.PRODUCT:
                    rulesObj[RULE_CONSTANT.PRODUCT].push(this.getProductName(item.productId));
                    this.productLength += 1;
                    break;
                case RULE_CONSTANT.STATES:
                    item.states.forEach((state) => {
                        rulesObj[RULE_CONSTANT.STATES].push(this.getDisplayTextOfStates(state));
                    });
                    this.statesLength += 1;
                    break;
                case RULE_CONSTANT.DATE_WRITTEN:
                    rulesObj[RULE_CONSTANT.DATE_WRITTEN].push(`${item.written.effectiveStarting}`);
                    this.dateWrittenLength += 1;
                    break;
                case RULE_CONSTANT.CARRIER:
                    rulesObj[RULE_CONSTANT.CARRIER].push(this.getCarrierName(item.carrierId));
                    this.careerLength += 1;
                    break;
                case RULE_CONSTANT.ENROLLMENT_METHOD:
                    rulesObj[RULE_CONSTANT.ENROLLMENT_METHOD].push(item.enrollmentMethod);
                    this.enrollmentMethodLength += 1;
                    break;
            }
        });

        return rulesObj;
    }

    /**
     * function to display the text of rule wrt to it's type
     * @param type: string, type of the rule
     * @returns string, name of the rule to be displayed
     */
    getRuleDisplayText(type: string): string {
        const rule = this.rulesList.find((x) => x.type === type);
        return rule ? rule.name : "";
    }

    /**
     * function to declare the list of all rules for commission split
     * @returns void
     */
    loadRulesList(): void {
        this.rulesList = [
            {
                type: RULE_CONSTANT.WRITING_PRODUCER,
                name: this.languageStrings["primary.portal.commissionSplit.addUpdate.ruleWritingProducer"],
            },
            {
                type: RULE_CONSTANT.PRODUCT,
                name: this.languageStrings["primary.portal.commissionSplit.addUpdate.ruleProduct"],
            },
            {
                type: RULE_CONSTANT.STATES,
                name: this.languageStrings["primary.portal.commissionSplit.addUpdate.ruleState"],
            },
            {
                type: RULE_CONSTANT.DATE_WRITTEN,
                name: this.languageStrings["primary.portal.commissionSplit.addUpdate.ruleDate"],
            },
            {
                type: RULE_CONSTANT.CARRIER,
                name: this.languageStrings["primary.portal.commissionSplit.addUpdate.ruleCarrier"],
            },
            {
                type: RULE_CONSTANT.ENROLLMENT_METHOD,
                name: this.languageStrings["primary.portal.commissionSplit.addUpdate.ruleEnrollMethod"],
            },
        ];
    }

    /**
     * function to get display texts of states
     * @param abbreviation: string, abbreviation of the state
     * @returns string, name of the state
     */
    getDisplayTextOfStates(abbreviation: string): string {
        const state = this.stateList.find((x) => x.abbreviation === abbreviation);
        return state ? state.name : "";
    }

    /**
     * function to direct to commission splits page
     * @returns void
     */
    directToCommissionSplits(): void {
        this.dialogRef.close();
    }

    /**
     * function to call when you want to replace the duplicate split
     * first delete the existing commission split
     * and then add the new one
     * @returns void
     */
    replaceCommissionSplit(): void {
        this.subscriptions.push(
            this.aflac
                .deleteCommissionSplit(this.mpGroupId, this.data.existingCommissionSplit.id)
                .pipe(flatMap(() => this.aflac.createCommissionSplit(this.mpGroupId, this.data.newCommissionSplit)))
                .subscribe(() => {
                    this.commissionSplitsService.setAction(true);
                    this.directToCommissionSplits();
                }),
        );
    }

    /**
     * function to get product name wrt to passed product id
     * @param productId: number, productId
     * @returns string, name of the product
     */
    getProductName(productId: number): string {
        const productObj = this.productList.find((product) => product.id === productId);
        return productObj ? productObj.name : "";
    }

    /**
     * function to get carrier name wrt to passed carrier id
     * @param carrierId: number, carrierId
     * @returns string, name of the carrier
     */
    getCarrierName(carrierId: number): string {
        const carrierObj = this.carrierList.find((carrier) => carrier.id === carrierId);
        return carrierObj ? carrierObj.name : "";
    }

    /**
     * function to be called if operation is cancelled
     * @returns void
     */
    onCancel(): void {
        this.directToCommissionSplits();
    }

    /**
     * Life cycle hook to unsubscribe the subscribed subscriptions
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
