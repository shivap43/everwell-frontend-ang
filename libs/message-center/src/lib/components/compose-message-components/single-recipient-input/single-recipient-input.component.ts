import { TargetUnitType } from "@empowered/api";
import { distinctUntilChanged, tap, filter, map, switchMap, takeUntil, shareReplay } from "rxjs/operators";
import { MessageCenterFacadeService } from "./../../../services/message-center-facade.service";
import { Observable, BehaviorSubject, Subject, combineLatest } from "rxjs";
import { FormBuilder, ControlContainer, AbstractControl, FormControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { Component, Input, Output, EventEmitter, OnDestroy, Optional, Host, SkipSelf, OnInit, Provider, forwardRef } from "@angular/core";
import { TitleCasePipe } from "@angular/common";
import { Store } from "@ngxs/store";
import { MessageCenterLanguage, Name } from "@empowered/constants";

const PORTAL_ADMIN = "admin";
const PORTAL_PRODUCER = "producer";

// The provider for the Control Value Accessor
const SINGLE_RECIPIENT_INPUT_VALUE_ACCESSOR_PROVIDER: Provider = {
    provide: NG_VALUE_ACCESSOR,
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    useExisting: forwardRef(() => SingleRecipientInputComponent),
    multi: true,
};

@Component({
    selector: "empowered-single-recipient-input",
    templateUrl: "./single-recipient-input.component.html",
    styleUrls: ["./single-recipient-input.component.scss"],
    providers: [SINGLE_RECIPIENT_INPUT_VALUE_ACCESSOR_PROVIDER],
})
export class SingleRecipientInputComponent implements ControlValueAccessor, OnInit, OnDestroy {
    readonly MessageCenterLanguage = MessageCenterLanguage;

    private readonly unsubscribe$: Subject<void> = new Subject();
    private readonly portalType$: BehaviorSubject<string> = new BehaviorSubject<string>(undefined);
    @Input() set portalType(newPortal: string) {
        this.portalType$.next(newPortal);
    }
    private readonly default$: BehaviorSubject<OptionData[]> = new BehaviorSubject<OptionData[]>([]);
    @Input() set default(newDefault: OptionData[]) {
        this.default$.next(newDefault);
    }
    protected readonly toProducer$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    @Input() set toProducer(newToProducer: boolean) {
        this.toProducer$.next(newToProducer);
    }
    @Input() formControlName;

    // OnChange function from Reactive forms
    onChange: (value: any) => void;

    @Output() latestValue: EventEmitter<OptionData[]> = new EventEmitter();

    recipient: FormControl = this.builder.control("");

    isProducer$: Observable<boolean> = this.portalType$.asObservable().pipe(map((portalType) => portalType === PORTAL_PRODUCER));
    isMultiple$: Observable<boolean> = this.portalType$.asObservable().pipe(map((portal) => portal && portal === PORTAL_PRODUCER));

    /**
     * Whenever the value of the select changes, emit the new value
     */
    private readonly recipientValueChanges$: Observable<OptionData[]> = this.recipient.valueChanges.pipe(
        distinctUntilChanged(),
        map((value) => (!Array.isArray(value) ? [value] : value)),
        tap((value) => {
            this.latestValue.emit(value);
            if (this.onChange) {
                this.onChange(value);
            }
        }),
        takeUntil(this.unsubscribe$),
    );

    /**
     * Whenever the portal type changes, get the appropriate data to display
     */
    dropDownData$: Observable<OptionData[]> = combineLatest(this.portalType$.asObservable(), this.toProducer$.asObservable()).pipe(
        filter(([portal]) => Boolean(portal)),
        switchMap(([portal, toProducer]) => {
            // For admins, display members
            if (portal === PORTAL_ADMIN && toProducer) {
                return this.messagingFacade.getProducers().pipe(
                    map((producers) =>
                        producers.map((producer) => {
                            let name = "";
                            if (producer.name) {
                                name = this.nameToString(producer.name);
                            }
                            if (producer.email) {
                                name = name ? `${name} - ${producer.email}` : producer.email;
                            }
                            return { value: producer.id, name: name, type: TargetUnitType.PRODUCER };
                        }),
                    ),
                );
            }
            if (portal === PORTAL_ADMIN) {
                return this.messagingFacade.getMembers().pipe(
                    map((members) =>
                        members.map((member) => {
                            let name: string =
                                `${this.titleCasePipe.transform(member.firstName)} ` + `${this.titleCasePipe.transform(member.lastName)}`;
                            if (member.email) {
                                name = `${name} - ${member.email}`;
                            }
                            return { value: member.id, name: name, type: TargetUnitType.MEMBER };
                        }),
                    ),
                );
            }
            // For producers, display admins
            if (portal === PORTAL_PRODUCER) {
                return this.messagingFacade
                    .getAdmins()
                    .pipe(
                        map((admins) =>
                            admins.map((admin) => ({ value: admin.id, name: this.nameToString(admin.name), type: TargetUnitType.ADMIN })),
                        ),
                    );
            }
            // For members, display categories
            return this.messagingFacade
                .getCategories()
                .pipe(
                    map((categories) =>
                        categories.map((category) => ({ value: category.id, name: category.name, type: TargetUnitType.CATEGORY })),
                    ),
                );
        }),
        takeUntil(this.unsubscribe$),
        shareReplay(1),
    );
    /**
     * When the default option gets set, select it when the data becomes available.
     */
    setDefault$: Observable<unknown> = combineLatest(this.dropDownData$, this.default$.asObservable()).pipe(
        filter(([dropDownData, preset]) => Boolean(dropDownData && preset && preset.length)),
        tap(([, preset]) => {
            this.recipient.setValue(preset, { emitEvent: false });
            this.default$.next(undefined);
        }),
        takeUntil(this.unsubscribe$),
    );

    constructor(
        private readonly builder: FormBuilder,
        private readonly messagingFacade: MessageCenterFacadeService,
        private readonly titleCasePipe: TitleCasePipe,
        private readonly store: Store,
        @Optional() @Host() @SkipSelf() private readonly controlContainer: ControlContainer,
    ) {
        this.recipientValueChanges$.subscribe();
        this.setDefault$.subscribe();
    }

    /**
     * Hook to write values for Reactive forms
     *
     * @param values new value to write
     */
    writeValue(values: OptionData[]): void {
        this.default$.next(values);
    }

    /**
     * Hook to emit new values to parent control
     *
     * @param onChange hook for reactive forms
     */
    registerOnChange(onChange: (value: any) => void): void {
        this.onChange = onChange;
    }

    /**
     * Hook to register a touch happened, ignored by this component
     * @param onTouched hook for reactive forms
     */
    registerOnTouched(onTouched: () => void): void {}

    /**
     * Register the abstract control from the parent to hook into the errors
     */
    ngOnInit(): void {
        if (this.formControlName && this.controlContainer) {
            const control: AbstractControl = this.controlContainer.control.get(this.formControlName);
            control.valueChanges
                .pipe(
                    map((value) => (control.invalid ? control.dirty || control.touched : false)),
                    tap((isInvalid) => this.recipient.setErrors(isInvalid ? { parentError: "Error in parent" } : null)),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }
    }

    /**
     * Unsubscribe from observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * Compare two different options, used by the mat-select when programmatically setting values
     *
     * @param optionOne First option
     * @param optionTwo Second option
     * @returns If the two options are equal
     */
    optionComparator(optionOne: OptionData, optionTwo: OptionData[]): boolean {
        return (
            optionTwo &&
            Boolean(
                optionTwo.find(
                    (option) => option.name === optionOne.name && optionOne.type === option.type && optionOne.value === option.value,
                ),
            )
        );
    }

    /**
     * Convert a name into a string
     *
     * @param name Name to convert
     * @returns Name converted to a string
     */
    private nameToString(name: Name): string {
        if (name == null) {
            return "";
        }

        return `${this.titleCasePipe.transform(name.firstName)} ${this.titleCasePipe.transform(name.lastName)}`;
    }
}

/**
 * Interface to better organize options
 */
export interface OptionData {
    value: number;
    name: string;
    type: TargetUnitType;
}
