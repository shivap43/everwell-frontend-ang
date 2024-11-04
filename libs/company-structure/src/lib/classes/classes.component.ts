import { ClassType, ClassNames, ClassTypeDisplay, AccountProfileService, AflacService, PeoClass } from "@empowered/api";
import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from "@angular/core";
import { HttpErrorResponse, HttpResponse, HttpHeaders } from "@angular/common/http";
import { take, map, flatMap, catchError, finalize, takeUntil, tap, filter, switchMap } from "rxjs/operators";
import { Observable, of, forkJoin, defer, throwError, Subject } from "rxjs";
import { PortalsService } from "../portals.service";
import { ClassTypeDetails } from "../shared/models/class-type-details.model";
import { ActionType } from "../shared/models/container-data-model";
import { EditClassComponent } from "./class/edit-class/edit-class.component";
import { ClassTypeComponent } from "./class-type/class-type.component";
import { ActivatedRoute } from "@angular/router";
import { LanguageService } from "@empowered/language";
import { AlertType, AppSettings } from "@empowered/constants";

@Component({
    selector: "empowered-classes",
    templateUrl: "./classes.component.html",
    styleUrls: ["./classes.component.scss"],
})
export class ClassesComponent implements OnInit, OnDestroy {
    @ViewChild("firstClassTypeView") firstClassTypeView: ClassTypeComponent;
    classTypesDisplay: ClassTypeDetails[];
    errorCode: string;
    oldDefaultClassType: ClassTypeDisplay;
    isLoading: boolean;
    mpGroup: number;
    zeroState = false;
    languageStrings: Record<string, string>;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    importPeoAlert: string;

    constructor(
        private readonly portalsService: PortalsService,
        private readonly accountProfileService: AccountProfileService,
        private readonly cdr: ChangeDetectorRef,
        private readonly route: ActivatedRoute,
        private readonly language: LanguageService,
        private readonly aflacService: AflacService,
    ) {}
    ngOnInit(): void {
        this.fetchLanguage();
        this.mpGroup = this.route.parent.parent.snapshot.params.mpGroupId;
        this.isLoading = true;
        this.getClassData().subscribe();
        this.portalsService.action$.pipe(takeUntil(this.unsubscribe$)).subscribe(this.handleAction);
    }
    handleAction = (actionObject) => {
        switch (actionObject.action) {
            case ActionType.class_first:
                this.createClassType(actionObject.data)
                    .pipe(take(1))
                    .subscribe((createdClassType) => {
                        if (createdClassType.classType.determinesPayFrequency) {
                            this.getClassType(this.oldDefaultClassType.id)
                                .pipe(take(1))
                                .subscribe((oldDefaultClassType) => {
                                    this.editInPlace(oldDefaultClassType);
                                    this.portalsService.defaultClassType = createdClassType.classType;
                                });
                        }
                        this.classTypesDisplay.shift();
                        this.classTypesDisplay.push(createdClassType);
                        this.portalsService.detachPortal();
                        if (this.classTypesDisplay.length > 0) {
                            this.portalsService.zeroState = false;
                            this.zeroState = false;
                        }
                    });
                break;
            case ActionType.class_create:
                this.createClass(actionObject.data)
                    .pipe(take(1))
                    .subscribe((createdClassType) => {
                        this.editInPlace(createdClassType);
                        this.portalsService.detachPortal();
                    });
                break;
            case ActionType.class_create_peo:
                this.isLoading = true;
                this.createPEOClass(actionObject.data)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe((createdClass) => {
                        this.editInPlace(createdClass);
                        this.portalsService.detachPortal();
                        this.isLoading = false;
                    });
                break;
            case ActionType.class_update:
                this.updateClass(actionObject.data)
                    .pipe(take(1))
                    .subscribe((updatedClassType) => {
                        this.editInPlace(updatedClassType);
                        this.portalsService.detachPortal();
                    });
                break;
            case ActionType.class_remove:
                this.deleteClass(actionObject.data)
                    .pipe(take(1))
                    .subscribe((classTypeGet) => {
                        this.editInPlace(classTypeGet);
                        actionObject.data.panel.close();
                    });
                break;
            case ActionType.class_remove_default:
                this.updateClass(actionObject.data.updateClassData)
                    .pipe(take(1))
                    .subscribe(() => {
                        this.deleteClass(actionObject.data.removeClassData)
                            .pipe(take(1))
                            .subscribe((classTypeGet) => {
                                this.editInPlace(classTypeGet);
                                actionObject.data.removeClassData.panel.close();
                            });
                    });
                break;
            case ActionType.class_type_update:
                this.updateClassType(actionObject.data)
                    .pipe(take(1))
                    .subscribe((classTypeGet) => {
                        if (classTypeGet.classType.determinesPayFrequency) {
                            this.getClassType(this.oldDefaultClassType.id)
                                .pipe(take(1))
                                .subscribe((oldDefaultClassType) => {
                                    this.editInPlace(oldDefaultClassType);
                                });

                            this.setPayFrequencyForClassesUnderType(
                                actionObject.data.classes,
                                actionObject.data["updateClassTypeReq"].payFrequencyId,
                                actionObject.data.classTypeId,
                            ).subscribe((classTypes) => {
                                this.editInPlace(classTypes[0]);
                            });
                        } else {
                            this.editInPlace(classTypeGet);
                        }
                        this.portalsService.detachPortal();
                    });
                break;
            case ActionType.class_type_create:
                // FIXME - Find a better solution to this.
                this.classTypesDisplay.unshift(actionObject.data);
                this.portalsService.detachPortal();
                this.portalsService.selectedClass = null;
                this.cdr.detectChanges();
                this.firstClassTypeView.addclassView.panel.disabled = false;
                this.firstClassTypeView.addclassView.panel.open();
                this.firstClassTypeView.addclassView.panel.afterExpand.pipe(take(2)).subscribe(() => {
                    this.portalsService.attachPortal(
                        EditClassComponent,
                        {
                            actionType: ActionType.class_first,
                            className: undefined,
                            classType: actionObject.data.classType,
                            defaultPayFreq: actionObject.data.defaultPayFreq,
                            classesList: [],
                            panel: this.firstClassTypeView.addclassView.panel,
                        },
                        "0",
                    );
                });
                break;
            case ActionType.class_type_remove:
                if (!actionObject.data) {
                    this.classTypesDisplay.shift();
                } else {
                    this.deleteClassType(actionObject.data.classTypeId)
                        .pipe(take(1))
                        .subscribe(() => {
                            this.classTypesDisplay = this.classTypesDisplay.filter(
                                (classTypesDisplayObj) => classTypesDisplayObj.classType.id !== actionObject.data.classTypeId,
                            );
                            if (this.classTypesDisplay.length === 0) {
                                this.portalsService.zeroState = true;
                                this.zeroState = true;
                            }
                            actionObject.data.panel.close();
                        });
                }
                break;
        }
    };
    /**
     * To get class types and transformed data for class display
     * @returns Observable<ClassTypeDetails | ClassType[]>
     */
    getClassData(): Observable<ClassTypeDetails[] | ClassType[]> {
        return this.accountProfileService.getClassTypes(`${this.mpGroup}`).pipe(
            take(1),
            map((classTypes) => classTypes.filter((c) => c.visible)),
            flatMap((classTypeArray) =>
                classTypeArray && classTypeArray.length === 0
                    ? of(null)
                    : forkJoin(classTypeArray.map((classType) => this.pipeTranformClassType(of(classType)))),
            ),
            catchError((httpErrorResponse: HttpErrorResponse) => this.handleError(httpErrorResponse, "getClassTypes")),
            tap((transformedArray) => {
                this.isLoading = false;
                this.classTypesDisplay = transformedArray;
                if (transformedArray && transformedArray.length === 0) {
                    this.portalsService.zeroState = true;
                    this.zeroState = true;
                }
            }),
            takeUntil(this.unsubscribe$),
        );
    }

    createClassType(payload: { classType: ClassType; class: ClassNames }): Observable<ClassTypeDetails> {
        return defer(() => {
            this.isLoading = true;
            return this.accountProfileService.createClassType(this.ignoreNullKeys(payload), `${this.mpGroup}`).pipe(
                flatMap((httpResponse) => {
                    switch (httpResponse.status) {
                        case AppSettings.API_RESP_201:
                            return this.getClassType(this.getClassTypeIdFromLocation(httpResponse.headers));
                        default:
                            return of(null);
                    }
                }),
                catchError((httpErrorResponse: HttpErrorResponse) => this.handleError(httpErrorResponse, "getClassType")),
                finalize(() => {
                    this.isLoading = false;
                }),
            );
        });
    }
    getClassType(classTypeId: number): Observable<ClassTypeDetails> {
        return this.pipeTranformClassType(this.accountProfileService.getClassType(classTypeId, `${this.mpGroup}`));
    }
    createClass(payload: {
        createClassReq: ClassNames;
        classTypeId: number;
    }): Observable<{ classType: ClassTypeDisplay; classes: ClassNames[] }> | undefined {
        return defer(() => {
            this.isLoading = true;
            return this.accountProfileService
                .createClass(
                    this.ignoreNullKeys({
                        ...payload.createClassReq,
                        clazz: {
                            ...payload.createClassReq,
                        },
                    }),
                    payload.classTypeId,
                    `${this.mpGroup}`,
                )
                .pipe(
                    flatMap((httpResponse) => {
                        switch (httpResponse.status) {
                            case AppSettings.API_RESP_201:
                                return this.getClassType(payload.classTypeId);
                        }
                        return undefined;
                    }),
                    catchError((httpErrorResponse: HttpErrorResponse) => this.handleError(httpErrorResponse, "createClass")),
                    finalize(() => {
                        this.isLoading = false;
                    }),
                );
        });
    }
    /**
     * Create a PEO class and get return an observable of the class type that was updated.
     * @param payload {PeoClass} request body
     * @returns Observable of the class type that was updated.
     */
    createPEOClass(payload: PeoClass): Observable<{ classType: ClassTypeDisplay; classes: ClassNames[] }> | undefined {
        return this.aflacService.createPeoClass(this.mpGroup, payload).pipe(
            flatMap((httpResponse) => {
                if (httpResponse.status === AppSettings.API_RESP_201) {
                    return this.getClassType(this.getClassTypeIdFromLocation(httpResponse.headers));
                }
                return undefined;
            }),
        );
    }
    updateClass(payload: { updateClassReq: unknown; classTypeId: number; classId: number }): Observable<ClassTypeDetails> | undefined {
        return defer(() => {
            this.isLoading = true;
            return this.accountProfileService
                .updateClass(this.ignoreNullKeys(payload.updateClassReq), payload.classTypeId, payload.classId, `${this.mpGroup}`)
                .pipe(
                    flatMap((httpResponse) => {
                        switch (httpResponse.status) {
                            case AppSettings.API_RESP_204:
                                return this.getClassType(+payload.classTypeId);
                        }
                        return undefined;
                    }),
                    catchError((httpErrorResponse: HttpErrorResponse) => this.handleError(httpErrorResponse, "updateClass")),
                    finalize(() => {
                        this.isLoading = false;
                    }),
                );
        });
    }
    deleteClass(payload: { classTypeId: number; classId: number }): Observable<ClassTypeDetails> | undefined {
        return defer(() => {
            this.isLoading = true;
            return this.accountProfileService.deleteClass(payload.classTypeId, payload.classId, `${this.mpGroup}`).pipe(
                flatMap((httpResponse) => {
                    switch (httpResponse.status) {
                        case AppSettings.API_RESP_204:
                            return this.getClassType(+payload.classTypeId);
                    }
                    return undefined;
                }),
                catchError((httpErrorResponse: HttpErrorResponse) => this.handleError(httpErrorResponse, "deleteClass")),
                finalize(() => {
                    this.isLoading = false;
                }),
            );
        });
    }

    updateClassType(payload: { updateClassTypeReq: unknown; classTypeId: number }): Observable<ClassTypeDetails> | undefined {
        return defer(() => {
            this.isLoading = true;
            return this.accountProfileService
                .updateClassType(this.ignoreNullKeys(payload.updateClassTypeReq), payload.classTypeId, `${this.mpGroup}`)
                .pipe(
                    flatMap((httpResponse) => {
                        switch (httpResponse.status) {
                            case AppSettings.API_RESP_204:
                                return this.getClassType(+payload.classTypeId);
                        }
                        return undefined;
                    }),
                    catchError((httpErrorResponse: HttpErrorResponse) => this.handleError(httpErrorResponse, "updateClassType")),
                    finalize(() => {
                        this.isLoading = false;
                    }),
                );
        });
    }
    deleteClassType(classTypeId: number): Observable<HttpResponse<void>> {
        return defer(() => {
            this.isLoading = true;
            return this.accountProfileService.deleteClassType(+classTypeId, `${this.mpGroup}`).pipe(
                catchError((httpErrorResponse: HttpErrorResponse) => this.handleError(httpErrorResponse, "deleteClassType")),
                finalize(() => {
                    this.isLoading = false;
                }),
            );
        });
    }
    setPayFrequencyForClassesUnderType(classes: ClassNames[], payFrequencyId: number, classTypeId: number): Observable<ClassTypeDetails[]> {
        return defer(() => {
            this.isLoading = true;
            return forkJoin(
                classes.map((className) =>
                    this.updateClass({
                        updateClassReq: Object.assign(className, {
                            payFrequencyId: payFrequencyId,
                        }),
                        classTypeId: classTypeId,
                        classId: className.id,
                    }),
                ),
            ).pipe(
                catchError((httpErrorResponse: HttpErrorResponse) =>
                    this.handleError(httpErrorResponse, "setPayFrequencyForClassesUnderType"),
                ),
                finalize(() => {
                    this.isLoading = false;
                }),
            );
        });
    }
    pipeTranformClassType(source: Observable<ClassType>): Observable<ClassTypeDetails> {
        return source.pipe(
            map((classType) => Object.assign({}, { classType: classType, classes: null })),
            flatMap((classTypeResponse) =>
                this.accountProfileService.getClasses(classTypeResponse.classType.id, `${this.mpGroup}`).pipe(
                    map((obj) => Object.assign(classTypeResponse, { classes: this.reOrderClasses(obj) })),
                    catchError((httpErrorResponse: HttpErrorResponse) => of(null)),
                ),
            ),
            map((obj) => {
                const totalNumberOfMembers = obj.classes
                    .map((className) => className.numberOfMembers)
                    .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
                const defaultClassForType = obj.classes.filter((klass) => klass.default)[0];
                const classTypeNew = Object.assign({}, obj.classType, {
                    totalNumberOfMembers: totalNumberOfMembers,
                    defaultClass: defaultClassForType,
                });
                if (classTypeNew.determinesPayFrequency) {
                    if (!this.oldDefaultClassType) {
                        this.oldDefaultClassType = classTypeNew;
                    } else {
                        this.oldDefaultClassType = this.portalsService.defaultClassType;
                    }
                    this.portalsService.defaultClassType = classTypeNew;
                }
                return Object.assign(obj, { classType: classTypeNew });
            }),
            catchError((httpErrorResponse: HttpErrorResponse) => this.handleError(httpErrorResponse, "getClassType")),
        );
    }
    ignoreNullKeys(form: unknown): any {
        // JSON.parse is needed here for the reviver function. Do not replace with utilService.copy
        return JSON.parse(JSON.stringify(form), (k, v) =>
            v === null || (typeof v === "object" && Object.keys(v).length === 0) ? undefined : v,
        );
    }
    editInPlace(classTypeDetails: ClassTypeDetails): void {
        const index = this.classTypesDisplay.findIndex(
            (classTypesDisplayObj) => classTypesDisplayObj.classType.id === classTypeDetails.classType.id,
        );
        this.classTypesDisplay[index] = classTypeDetails;
        this.cdr.detectChanges();
    }
    reOrderClasses(classNames: ClassNames[]): ClassNames[] {
        const defaultClass = classNames.find((className) => className.default === true);
        if (defaultClass) {
            return [defaultClass, ...classNames.filter((className) => className.default === false)];
        }
        return classNames;
    }
    handleError(httpErrorResponse: HttpErrorResponse, endPoint: string): Observable<null> {
        this.errorCode = `${endPoint}.${httpErrorResponse.error.code}`;
        this.isLoading = false;
        return throwError(this.errorCode);
    }
    getClassTypesList(): string[] {
        return this.classTypesDisplay.map((cl) => cl.classType.name);
    }
    fetchLanguage(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues(["primary.portal.classes.header"]);
    }
    /**
     * Get the id of the class type created through createClass or createPEOClass
     * For example:
     * If location = "/api/aflac/account/classTypes/4/classes/168" the class type id is 4.
     * If location = "/api/aflac/account/classTypes/25" the class type id is 25.
     * @param httpHeaders {HttpHeaders} response headers from the POST request
     * @returns {number} class type id of the newly created class
     */
    getClassTypeIdFromLocation(httpHeaders: HttpHeaders): number {
        const location = httpHeaders.get("location").split("/").slice();
        return Number(location[location.indexOf("classTypes") + 1]);
    }
    /**
     * To import peo data on click of refresh peo data
     */
    importPeoData(): void {
        this.isLoading = true;
        this.importPeoAlert = null;
        this.aflacService
            .importPeoData(this.mpGroup, { peoClass: "peo", importPeoData: true })
            .pipe(
                tap((importDetails) => {
                    if (importDetails && importDetails.importRowCount) {
                        this.importPeoAlert = AlertType.SUCCESS;
                    } else {
                        this.importPeoAlert = AlertType.WARNING;
                    }
                }),
                catchError(() => {
                    this.importPeoAlert = AlertType.DANGER;
                    return of(null);
                }),
                filter((importDetails) => !!(importDetails && importDetails.importRowCount)),
                switchMap(() => this.getClassData()),
                finalize(() => (this.isLoading = false)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Cleans up subscriptions
     * @returns nothing
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
