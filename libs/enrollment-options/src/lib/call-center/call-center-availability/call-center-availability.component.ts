import { OnInit, Component, Input, OnDestroy } from "@angular/core";
import { FormArray, FormBuilder, FormGroup } from "@angular/forms";
import { Subject } from "rxjs";
import { distinctUntilChanged, takeUntil, tap } from "rxjs/operators";
import { CallingScheduleTime } from "../../models/manage-call-center.model";

interface CallCenterWeeklySchedule {
    day: string;
    startTime: string;
    endTime: string;
    selected: boolean;
}

@Component({
    selector: "empowered-call-center-availability",
    templateUrl: "./call-center-availability.component.html",
    styleUrls: ["./call-center-availability.component.scss"],
})
export class CallCenterAvailabilityComponent implements OnInit, OnDestroy {
    @Input() callSchedule: FormGroup;
    @Input() callCenterAvailabilityStartTimes: CallingScheduleTime[];
    @Input() callCenterAvailabilityEndTimes: CallingScheduleTime[];
    @Input() timeZones: string[];

    displayedColumns = ["selected", "day", "startTime", "endTime"];
    dataSource = [];
    selectAllDays = this.formBuilder.control(false);
    indeterminate: boolean;

    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    constructor(private readonly formBuilder: FormBuilder) {}

    /**
     * Observe changes to form fields.
     */
    ngOnInit(): void {
        const dailySchedule = this.callSchedule.controls.dailySchedule as FormArray;
        this.dataSource = dailySchedule.value.map((schedule) => ({
            day: schedule.day,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
        }));

        this.updateSelectAllDays(dailySchedule.value);

        this.selectAllDays.valueChanges
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((all) => dailySchedule.controls.forEach((group: FormGroup) => group.controls.selected.setValue(all))),
            )
            .subscribe();

        dailySchedule.valueChanges
            .pipe(
                takeUntil(this.unsubscribe$),
                distinctUntilChanged((prevSchedule, currSchedule) =>
                    prevSchedule.map((day) => day.selected).every((selectedDay, index) => selectedDay === currSchedule[index].selected),
                ),
                tap((days) => {
                    this.updateSelectAllDays(days);
                }),
            )
            .subscribe();

        dailySchedule.statusChanges
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((status) => {
                    const error = dailySchedule.errors && dailySchedule.errors.atLeastOneDayIsRequired ? { required: true } : null;
                    dailySchedule.controls.forEach((group: FormGroup) => {
                        group.controls.selected.setErrors(error, { emitEvent: false });
                    });
                    this.selectAllDays.setErrors(error, { emitEvent: false });
                }),
            )
            .subscribe();
    }

    /**
     * Updates the 'select all' checkbox according to the days selected in the call schedule.
     *
     * @param calling schedule, includes info about the whether a day is selected,
     * the start and end times
     */
    updateSelectAllDays(days: CallCenterWeeklySchedule[]): void {
        const numberOfSelectedDays = days.filter((day) => day.selected).length;

        // set as indeterminate if some but not all days are selected
        this.indeterminate = numberOfSelectedDays > 0 && numberOfSelectedDays < days.length;

        // set as false if none are selected, and as true if all days are selected
        if (numberOfSelectedDays === 0) {
            this.selectAllDays.setValue(false);
        } else if (numberOfSelectedDays === days.length) {
            this.selectAllDays.setValue(true);
        }
    }

    /**
     * Cleans up subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
