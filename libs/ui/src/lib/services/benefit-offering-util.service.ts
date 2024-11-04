import { Injectable } from "@angular/core";
import { AbstractControl, ValidationErrors, FormControl, FormGroup } from "@angular/forms";
import { Admin, ArgusCarrier, DateFormats, PlanPanel } from "@empowered/constants";
import { MatTableDataSource } from "@angular/material/table";
import { Observable } from "rxjs";
import { AddAdminByImportingComponent, AddAdminComponent, AddAdminManuallyComponent, AddAdminViaCensusComponent } from "../business";
import { MatDialog } from "@angular/material/dialog";
import { EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";

const END_DATE_VAR = "endDate";
const START_DATE_VAR = "startDate";

@Injectable({
    providedIn: "root",
})
export class BenefitOfferingUtilService {
    addAdminOptions = ["manually", "employee", "import"];

    constructor(
        private readonly dialog: MatDialog,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly dateService: DateService,
    ) {}

    /**
     * The below method is used to reset particular error in the formControl
     * @param control is the abstract control
     * @param error is error variable
     */
    setFormControlErrors(control: AbstractControl, error: string): void {
        const err: ValidationErrors = control.errors; // get control errors
        if (err) {
            delete err[error]; // delete error
            if (!Object.keys(err).length) {
                // if no errors left
                control.setErrors(null); // set control errors to null making it VALID
            } else {
                control.setErrors(err); // controls got other errors so set them back
            }
        }
    }
    /**
     * The below method is bound to form control and validates the input date to be greater than current date
     * @param control is formControl value
     * @returns ValidationErrors for currently called form-control
     */
    checkDate(control: FormControl): ValidationErrors {
        if (control.value && control.value.toString().trim().length) {
            const date: Date = new Date();
            const inputDate: Date = this.dateService.toDate(control.value);
            if (!inputDate) {
                return { required: true };
            }
            const dateObject: Date = this.dateService.parseDate(control.value, DateFormats.MONTH_DAY_YEAR);
            if (dateObject && !this.dateService.isValid(dateObject) && control.value.length !== 0) {
                return { invalid: true };
            }
            inputDate.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);
            if (inputDate < date) {
                return { pastDate: true };
            }
            return null;
        }
        return { required: true };
    }
    /**
     * This method will be called on blur of date-input after entering input
     * This method is used to check whether entered date is valid or not
     * @param event is date value
     */
    onBlur(event: string, control: FormControl): void {
        if (control && event && !Date.parse(event)) {
            control.setErrors({ invalid: true });
        }
    }
    /**
     * This method will be called on input of date-filed
     * This method is used to check whether entered date is valid or not
     * @param event is date value
     * @param control is form control of selected date-picker
     */
    checkDateInput(event: string, control: AbstractControl): void {
        if (event) {
            const inputDate: Date = this.dateService.toDate(event);
            if (isNaN(inputDate.getTime())) {
                control.setErrors({ invalid: true });
            }
        }
    }
    /**
     * This below method is used to validate date should be greater than or lesser than the date
     * @param control Form control to take the date value
     * @returns ValidationErrors for currently called form-control, if any
     */
    checkStartDate(from: string, control: FormControl, parentFormGroup: FormGroup): ValidationErrors | void {
        if (control?.value) {
            let date: Date;
            const inputDate: Date = this.dateService.toDate(control.value);
            inputDate.setHours(0, 0, 0, 0);
            if (parentFormGroup?.controls?.endDate?.value && from === START_DATE_VAR) {
                date = this.dateService.toDate(parentFormGroup?.controls["endDate"]?.value);
                date.setHours(0, 0, 0, 0);
                this.setFormControlErrors(parentFormGroup.controls["endDate"], "invalidEndDate");
            }
            if (parentFormGroup?.controls?.startDate?.value && from === END_DATE_VAR) {
                date = this.dateService.toDate(parentFormGroup?.controls["startDate"]?.value);
                date.setHours(0, 0, 0, 0);
                this.setFormControlErrors(parentFormGroup.controls["startDate"], "invalidStartDate");
            }
            const returnValue: ValidationErrors = this.getValidationError(inputDate, date, from);
            if (returnValue) {
                return returnValue;
            }
        }
    }
    /**
     * This method is used to check validations for start date and end date
     * @param inputDate is inputDate of control
     * @param date is start date / end date based on condition
     * @param from is used to define whether it coming from startDate or endDate
     * @returns ValidationErrors for currently called form-control
     */
    getValidationError(inputDate: Date, date: Date, from: string): ValidationErrors {
        if (inputDate && date) {
            if (inputDate > date && from === START_DATE_VAR) {
                return { invalidStartDate: true };
            }
            if (inputDate < date && from === END_DATE_VAR) {
                return { invalidEndDate: true };
            }
        }
        return null;
    }

    /**
     * This method is used to split the planIds from inputted config value
     * @param tierPlanConfigValue is the inputted config value
     * @returns array of plan ids based on inputted config value
     */
    getArgusDentalTierPlans(tierPlanConfigValue: string): number[] {
        const eachPlanDetails = tierPlanConfigValue.replace("[", "").replace("]", "").split("=");
        return eachPlanDetails[1].split(",").map((eachPlanId) => +eachPlanId.replace(/"/g, ""));
    }

    /**
     * This method is used to split the inputted config value, forms an model of type ArgusCarrier and returns the same
     * @param config is the inputted config value to split
     * @returns array of ArgusCarrier based on inputted config value
     */
    getArgusRestrictions(config: string): ArgusCarrier[] {
        const argusCarrierMaps = config.replace(/\s/g, "").split(";");
        return argusCarrierMaps.map((carrier) => {
            const stateName = carrier.split("=");
            const restrictions = stateName[1].substring(1, stateName[1].length - 1).split(",");
            const restrictionsDetail = restrictions.map((restriction) => {
                const employeeRange = restriction.split(":");
                const minEmployees = employeeRange[0].substring(0, employeeRange[0].length).split("-");

                return {
                    minEmployees: +minEmployees[0],
                    maxEmployees: +minEmployees[1],
                    allowedPlans: +employeeRange[1],
                };
            });
            return {
                stateName: stateName[0],
                restrictions: restrictionsDetail,
            };
        });
    }

    /**
     * Method to determine if ADV plan type selection
     *
     * @param selectedCarriers
     * @param advCarriers
     * @param plans
     * @param isADVEROption
     * @param isERSelected
     * @param isERSelection
     * @param allPlans
     * @returns isADVEROption, isERSelection
     */
    advPlanTypeSelection(
        selectedCarriers: number[],
        advCarriers: number[],
        plans: PlanPanel[],
        isERSelected: boolean,
        allPlans: MatTableDataSource<PlanPanel>,
    ): { isADVEROption: boolean; isERSelection: boolean } {
        let isADVEROption: boolean;
        let isERSelection: boolean;
        if (this.isADVCarrierSelected(selectedCarriers, advCarriers)) {
            const advPlans = plans.filter((plan) => plan.carrierId === advCarriers[0]);
            isADVEROption = advPlans.some((plan) => plan.isAutoEnrollable) && advPlans.some((plan) => !plan.isAutoEnrollable);
            if (isADVEROption) {
                const plansSelected = advPlans.filter((plan) => plan.selected);
                if (isERSelected === undefined) {
                    const isERPlanSelected = plansSelected.some((plan) => plan.isAutoEnrollable);
                    isERSelection = plansSelected.length > 0 ? isERPlanSelected : false;
                    allPlans.data = advPlans.filter((plan) => plan.isAutoEnrollable === isERSelection);
                } else {
                    isERSelection = isERSelected;
                    this.filterADVPlans(allPlans, advPlans, isERSelected, isERSelection, plansSelected, plans);
                }
            } else {
                allPlans.data = advPlans;
            }
        } else {
            allPlans.data = plans;
        }
        return { isADVEROption, isERSelection };
    }

    /**
     * Method to check if ADV is the selected carrier
     *
     * @param plansToCompare
     * @param selectedCarriers
     * @param advCarriers
     * @returns
     */
    isADVCarrierSelected(selectedCarriers: number[], advCarriers: number[]): boolean {
        return selectedCarriers.some((carrier) => advCarriers && advCarriers.includes(carrier));
    }

    /**
     * Method to filter the ADV plans based on plan type selection
     *
     * @param allPlans
     * @param advPlans
     * @param isERSelected
     * @param isERSelection
     * @param plansSelected
     * @param plans
     * @returns isERSelection
     */
    private filterADVPlans(
        allPlans: MatTableDataSource<PlanPanel>,
        advPlans: PlanPanel[],
        isERSelected: boolean,
        isERSelection: boolean,
        plansSelected: PlanPanel[],
        plans: PlanPanel[],
    ): void {
        allPlans.data = advPlans.filter((plan) => plan.isAutoEnrollable === isERSelected);

        if (plansSelected.length > 0) {
            if (isERSelected) {
                plans.forEach((plan) => {
                    if (!plan.isAutoEnrollable && plan.selected) {
                        plan.selected = false;
                    }
                });
            } else {
                plans.forEach((plan) => {
                    if (plan.isAutoEnrollable && plan.selected) {
                        plan.selected = false;
                    }
                });
            }
        }
    }
    // Method to open popup asking user to add admin
    addAdminPopUp(): Observable<string> {
        return this.empoweredModalService.openDialog(AddAdminComponent).afterClosed();
    }

    // Method to open popup to add admin
    addAdmin(allAdmins: Admin[], choice: string): Observable<boolean | string> {
        let component;
        switch (choice) {
            case this.addAdminOptions[0]:
                component = AddAdminManuallyComponent;
                break;
            case this.addAdminOptions[1]:
                component = AddAdminViaCensusComponent;
                break;
            case this.addAdminOptions[2]:
                component = AddAdminByImportingComponent;
                break;
        }
        return this.dialog
            .open(component, {
                backdropClass: "backdrop-blur",
                maxWidth: "600px",
                panelClass: "manual-list",
                data: {
                    editAdministrator: false,
                    allAdmins,
                },
            })
            .afterClosed();
    }
}
