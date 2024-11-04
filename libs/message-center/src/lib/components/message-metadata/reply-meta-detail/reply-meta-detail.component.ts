import { Component, Input } from "@angular/core";
import { TargetUnit, MessageCategory } from "@empowered/api";
import { BehaviorSubject, Observable } from "rxjs";
import { LanguageService } from "@empowered/language";
import { MessageCenterLanguage } from "@empowered/constants";

@Component({
  selector: "empowered-reply-meta-detail",
  templateUrl: "./reply-meta-detail.component.html",
  styleUrls: ["./reply-meta-detail.component.scss"]
})
export class ReplyMetaDetailComponent {

  // Language
  labelTo = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.REPLY_META_TO);
  labelSubject = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.REPLY_META_SUBJECT);
  labelCategory = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.REPLY_META_CATEGORY);

  private readonly _to$: BehaviorSubject<TargetUnit> = new BehaviorSubject<TargetUnit>(undefined);
  private readonly _subject$: BehaviorSubject<string> = new BehaviorSubject<string>(undefined);
  private readonly _category$: BehaviorSubject<MessageCategory> = new BehaviorSubject<MessageCategory>(undefined);

  to$: Observable<TargetUnit> = this._to$.asObservable();
  subject$: Observable<string> = this._subject$.asObservable();
  category$: Observable<MessageCategory> = this._category$.asObservable();

  @Input() set to (newTo: TargetUnit) {
    this._to$.next(newTo);
  }

  get to (): TargetUnit {
    return this._to$.value;
  }

  @Input() set subject (newSubject: string) {
    this._subject$.next(newSubject);
  }

  get subject (): string {
    return this._subject$.value;
  }

  @Input() set category(newCategory: MessageCategory) {
    this._category$.next(newCategory);
  }

  get category (): MessageCategory {
    return this._category$.value;
  }

  constructor(private readonly languageService: LanguageService) { }
}
