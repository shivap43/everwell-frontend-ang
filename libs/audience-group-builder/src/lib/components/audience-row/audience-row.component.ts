/* eslint-disable max-classes-per-file */

import { AbstractControl } from "@angular/forms";
import { FormBuilder, FormGroup } from "@angular/forms";
import { AbstractAudience, AudienceType } from "@empowered/api";
import {
    Component,
    Input,
    Output,
    EventEmitter,
    ComponentRef,
    ViewChild,
    ViewContainerRef,
    ComponentFactoryResolver,
    OnDestroy,
} from "@angular/core";
import { AudienceInput } from "../audience-rows/AudienceInput";
import { Observable, Subscription, BehaviorSubject, EMPTY } from "rxjs";
import { AudienceOption } from "../audience-builder-container/audience-builder-container.component";
import { EmployeeIdAudienceInputComponent } from "../audience-rows/employee-id-audience-input/employee-id-audience-input.component";
import { shareReplay, withLatestFrom, filter, map, tap, switchMap, startWith } from "rxjs/operators";
import { ClassTypeAudienceInputComponent } from "../audience-rows/class-type-audience-input/class-type-audience-input.component";
// eslint-disable-next-line max-len
import { EmployeeStatusAudienceInputComponent } from "../audience-rows/employee-status-audience-input/employee-status-audience-input.component";
import { RegionTypeAudienceInputComponent } from "../audience-rows/region-type-audience-input/region-type-audience-input.component";
import { ProductAudienceInputComponent } from "../audience-rows/product-audience-input/product-audience-input.component";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-audience-row",
    templateUrl: "./audience-row.component.html",
    styleUrls: ["./audience-row.component.scss"],
})
export class AudienceRowComponent implements OnDestroy {
    conditionPlaceholder: string = this.languageService.fetchPrimaryLanguageValue("primary.portal.audienceBuilder.audienceTypeDefault");

    // Dynamic ID from the parent
    @Input() id: number;
    // The audience options the row can display
    @Input() availableAudienceConditions$: Observable<AudienceOption[]>;
    // Defines if this is the first row or not
    @Input() isFirst = true;

    // Selections to make when availableAudienceConditions$ loads
    private futureSelection$: BehaviorSubject<FutureSelection> = new BehaviorSubject(null);

    // Emits when the user clicks the delete button on this row
    @Output() deleteRow: EventEmitter<number> = new EventEmitter();
    private audienceValue$: BehaviorSubject<AbstractAudience[]> = new BehaviorSubject(null);
    private isvalid$: BehaviorSubject<Observable<boolean>> = new BehaviorSubject(EMPTY);
    @ViewChild("inputContainer", { read: ViewContainerRef, static: true }) inputContainer: ViewContainerRef;

    currentOptionType: AudienceType = null;
    private currentContextData: any = null;

    form: FormGroup = this.builder.group({
        audienceType: [""],
    });

    lastSelected$: Observable<AudienceOption>;

    submitEvent$: Observable<void> = EMPTY;

    inputRef: ComponentRef<AudienceInput<AbstractAudience>>;

    subscriptions: Subscription[] = [];

    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.audienceBuilder.removeCondition",
    ]);

    constructor(
        private readonly builder: FormBuilder,
        private readonly resolver: ComponentFactoryResolver,
        private readonly languageService: LanguageService,
    ) {}

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    getControl(): AbstractControl {
        return this.form.controls["audienceType"];
    }

    getAudienceValueStream(): Observable<AbstractAudience[]> {
        return this.audienceValue$.asObservable();
    }

    getDeleteRequestStream(): Observable<number> {
        return this.deleteRow.asObservable();
    }

    propagateDeleteRequest(): void {
        this.deleteRow.emit(this.id);
    }
    isValidStream(): Observable<boolean> {
        return this.isvalid$.asObservable().pipe(
            switchMap((isValid) => isValid),
            startWith(false),
        );
    }
    invokeValidation(): void {
        if (this.inputRef && this.inputRef.instance) {
            this.inputRef.instance.validate();
        }
    }
    /**
     * Programatically set the available audience types
     * @param conditions Selectable audiece types
     */
    setAvailableAudienceConditions(conditions: Observable<AudienceOption[]>): void {
        this.availableAudienceConditions$ = conditions.pipe(
            withLatestFrom(this.futureSelection$.asObservable()),
            // Check to see if any of the options that are supposed to be selected are available
            tap(([availableAudienceConditions, futureSelection]) => {
                if (futureSelection != null) {
                    availableAudienceConditions.forEach((audience) => {
                        if (audience.type === futureSelection.type && futureSelection.contextValue == null) {
                            this.futureSelection$.next(null);
                            this.form.controls["audienceType"].setValue(audience.id, { emitEvent: true });
                            this.inputRef.instance.setValue(futureSelection.values);
                        }
                        if (audience.subValues != null) {
                            audience.subValues.forEach((subValue) => {
                                if (subValue.type === futureSelection.type && subValue.contextValue === futureSelection.contextValue) {
                                    this.futureSelection$.next(null);
                                    this.form.controls["audienceType"].setValue(subValue.id, { emitEvent: true });
                                    this.inputRef.instance.setValue(futureSelection.values);
                                }
                            });
                        }
                    });
                }
            }),
            map(([availableAudienceConditions]) => availableAudienceConditions),
        );
        // Keep track of the latest audience type selected
        this.lastSelected$ = this.form.controls["audienceType"].valueChanges.pipe(
            withLatestFrom(this.availableAudienceConditions$),
            map(([idValue, availableAudienceConditions]) => {
                let targetAudience: AudienceOption;
                availableAudienceConditions.forEach((audience) => {
                    if (audience.id === idValue) {
                        targetAudience = audience;
                    }
                    if (audience.subValues != null) {
                        audience.subValues.forEach((subValue) => {
                            if (subValue.id === idValue) {
                                targetAudience = subValue;
                            }
                        });
                    }
                });
                return targetAudience;
            }),
            filter((audience) => audience != null),
            shareReplay(1),
        );
        this.subscriptions.push(this.lastSelected$.subscribe((option) => this.onTypeChange(option)));
    }

    /**
     * Programatically set submit event observable from audience builder container
     * @param submitEventObs$ submit event observable
     */
    setSubmitEvent(submitEventObs$: Observable<void>): void {
        this.submitEvent$ = submitEventObs$;
    }

    /**
     * Select the given values when they become available in the dataset
     *
     * @param type The type of the option
     * @param values the audience groupings for the given type
     * @param contextValue optional context value (for sub-types)
     */
    selectWhenAvailable(type: AudienceType, values: AbstractAudience[], contextValue?: any): void {
        this.futureSelection$.next({
            type: type,
            values: values,
            contextValue: contextValue != null ? contextValue : null,
        });
    }

    /**
     * Delete the old input, build the appropriate new input, and store the reference
     *
     * @param option new option
     */
    onTypeChange(option: AudienceOption): void {
        if (!(this.currentOptionType === option.type && this.currentContextData === option.contextValue)) {
            this.currentOptionType = option.type;
            this.currentContextData = option.contextValue;

            if (this.inputRef != null) {
                this.inputRef.destroy();
            }

            // Clear out any stored audience condition on audience type changes
            this.audienceValue$.next(null);

            // eslint-disable-next-line no-use-before-define,@typescript-eslint/no-use-before-define
            this.inputRef = this.initializeInputComponent(option);
            this.isvalid$.next(this.inputRef.instance.isValid());
        }
    }

    /**
     * Build the appropriate new audience input
     * @param option the new selected audince type
     */
    private initializeInputComponent(option: AudienceOption): ComponentRef<AudienceInput<AbstractAudience>> {
        // eslint-disable-next-line no-use-before-define, @typescript-eslint/no-use-before-define
        const ref: ComponentRef<AudienceInput<AbstractAudience>> = AudienceRowInputFactory.addNewConditionInput(
            this.inputContainer,
            this.resolver,
            option.type,
        );

        ref.instance.setSubmitEvent(this.submitEvent$);

        this.subscriptions.push(ref.instance.getMappedControlValueChanges().subscribe((resp) => this.audienceValue$.next(resp)));

        if (option.contextValue != null) {
            ref.instance.setInitializerData(option.contextValue);
        }

        return ref;
    }
}

// eslint-disable-next-line max-classes-per-file
class AudienceRowInputFactory {
    /**
     * Create the appropriate input component based on the option type, the default option type is EMPLOYEE_ID
     * @param view The view in which to create the component
     * @param optionType The desired option type of the component
     * @param contextData Option context data for the component (sub-value data)
     */
    static addNewConditionInput(
        view: ViewContainerRef,
        resolver: ComponentFactoryResolver,
        optionType: AudienceType,
    ): ComponentRef<AudienceInput<AbstractAudience>> {
        let factory;
        switch (optionType) {
            case "SSN":
                factory = resolver.resolveComponentFactory(EmployeeIdAudienceInputComponent);
                break;
            case "EMPLOYMENT_STATUS":
                factory = resolver.resolveComponentFactory(EmployeeStatusAudienceInputComponent);
                break;
            case "CLAZZ":
                factory = resolver.resolveComponentFactory(ClassTypeAudienceInputComponent);
                break;
            case "REGION":
                factory = resolver.resolveComponentFactory(RegionTypeAudienceInputComponent);
                break;
            case "ENROLLMENT_PLAN":
                factory = resolver.resolveComponentFactory(ProductAudienceInputComponent);
                break;
            default:
                factory = resolver.resolveComponentFactory(EmployeeIdAudienceInputComponent);
                break;
        }
        return view.createComponent(factory);
    }
}

// Interface to define requirements for future selection
interface FutureSelection {
    type: AudienceType;
    values: AbstractAudience[];
    contextValue?: any;
}
