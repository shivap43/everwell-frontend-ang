import { BehaviorSubject, Observable, Subject } from "rxjs";
import { Component, OnDestroy } from "@angular/core";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { ActivatedRoute } from "@angular/router";
import { map, tap, takeUntil } from "rxjs/operators";
import { LanguageService } from "@empowered/language";
import { MessageCenterLanguage } from "@empowered/constants";

const MIN_TAB_INDEX = 0;
const MAX_TAB_INDEX = 2;
const DEFAULT_TAB_INDEX = 0;
const QUERY_PARAM_TAB = "tab";
const TAB_CATEGORIES_INDEX = 0;
const TAB_ADMINS_INDEX = 1;
const DISPLAY_CLASS_FLEX = "flex";
const DISPLAY_CLASS_NONE = "none";

@Component({
  selector: "empowered-message-center-settings-container",
  templateUrl: "./message-center-settings-container.component.html",
  styleUrls: ["./message-center-settings-container.component.scss"]
})
export class MessageCenterSettingsContainerComponent implements OnDestroy {
  MessageCenterLanguage = MessageCenterLanguage;
  tabs: SettingType[] = ["CATEGORIES", "ADMINS"];
  animationDuration = 0;

  tabCategories = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.SETTINGS_CONTAINER_TAB_CATEGORIES);
  tabAdmins = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.SETTINGS_CONTAINER_TAB_ADMINS);

  private readonly unsubscribe$: Subject<void> = new Subject<void>();
  private readonly selectedTabIndexSubject$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  selectedTabIndex$: Observable<number> = this.selectedTabIndexSubject$.asObservable();

  categoryDisplayClass$: Observable<string> = this.selectedTabIndex$.pipe(
      map(tabIndex => tabIndex === TAB_CATEGORIES_INDEX ? DISPLAY_CLASS_FLEX : DISPLAY_CLASS_NONE)
    );
  adminDisplayClass$: Observable<string> = this.selectedTabIndex$.pipe(
      map(tabIndex => tabIndex === TAB_ADMINS_INDEX ? DISPLAY_CLASS_FLEX : DISPLAY_CLASS_NONE)
    );

  /**
   * Monitor the query parameters to see if tab is featured, and navigate to the appropriate tab if valid
   *
   * @param route
   * @param languageService
   */
  constructor(private readonly route: ActivatedRoute, private readonly languageService: LanguageService) {
    this.route.queryParamMap.pipe(
        map(queryParams => {
            if (queryParams.has(QUERY_PARAM_TAB)) {
                const tabParam: string = queryParams.get(QUERY_PARAM_TAB).toUpperCase();

                if (tabParam === "CATEGORIES" || tabParam === "ADMINS") {
                    return tabParam;
                }
            }
            return "CATEGORIES" as SettingType;
        }),
        map(settingType => this.tabs.indexOf(settingType) !== -1 ? this.tabs.indexOf(settingType) : 0),
        tap(boxIndex => this.selectedTabIndexSubject$.next(boxIndex)),
        takeUntil(this.unsubscribe$)
    ).subscribe();
  }

  /**
   * Unsubscribe on destroy
   */
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /**
   * On change event, navigate to the requested tab
   *
   * @param tabChangeEvent event from mat tab
   */
  onTabChange(tabChangeEvent: MatTabChangeEvent): void {
    this.selectedTabIndexSubject$.next(tabChangeEvent.index >= MIN_TAB_INDEX && tabChangeEvent.index < MAX_TAB_INDEX ?
        tabChangeEvent.index :
        DEFAULT_TAB_INDEX
      );
  }
}

type SettingType = "CATEGORIES" | "ADMINS";
