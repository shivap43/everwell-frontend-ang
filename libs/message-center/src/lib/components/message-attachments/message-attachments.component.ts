import { Component, Input, OnDestroy } from "@angular/core";
import { MessageAttachment, ReferenceType, DocumentApiService, AccountService, ResourceType } from "@empowered/api";
import { BehaviorSubject, Observable, of, defer, forkJoin, Subject } from "rxjs";
import { map, tap, switchMap, first, takeUntil, filter } from "rxjs/operators";
import { MessageCenterLanguage } from "@empowered/constants";
import { LanguageService } from "@empowered/language";

/**
 * Function to better organize what an attachment is
 */
interface AttachmentMeta {
  name: string;
  type: string;
  viewFunction: () => Observable<unknown>;
}

@Component({
  selector: "empowered-message-attachments",
  templateUrl: "./message-attachments.component.html",
  styleUrls: ["./message-attachments.component.scss"]
})
export class MessageAttachmentsComponent implements OnDestroy {
  MessageCenterLanguage = MessageCenterLanguage;
  private readonly unsubscribe$: Subject<void> = new Subject<void>();

  private readonly _attachments$: BehaviorSubject<MessageAttachment[]> = new BehaviorSubject<MessageAttachment[]>([]);
  attachments$: Observable<AttachmentMeta[]> = this._attachments$.pipe(
      filter(attachments => Boolean(attachments) && attachments.length > 0),
      switchMap(attachments => forkJoin([...attachments.map(attachment => this.convertAttachment(attachment))])),
    );

  @Input() set attachments(newAttachments: MessageAttachment[]) {
    this._attachments$.next(newAttachments);
  }

  constructor(
      private readonly documentService: DocumentApiService,
      private readonly accountService: AccountService,
      private readonly languageService: LanguageService) { }

  /**
   * Unsubscribe from observables here
   */
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /**
   * Uses the supplier function to open the attachment in a new tab
   *
   * @param viewFunction function to provide the way to download the attachment
   */
  onViewClick(viewFunction: () => Observable<unknown>): void {
    viewFunction.apply(null, []).pipe(
        takeUntil(this.unsubscribe$)
      ).subscribe();
  }

  /**
   * Converts the attachment id and type into its name and location
   *
   * @param attachment The attachment to request details for
   * @returns A request to get the appropriate document / resource data
   */
  private convertAttachment(attachment: MessageAttachment): Observable<AttachmentMeta> {
    switch (attachment.referenceType) {
      case ReferenceType.PLAN_DOCUMENT:
        // TODO :: Figure this out with contracts
        return of({ name: "PLAN DOCUMENT", type: "PLAN DOCUMENT TYPE", viewFunction: () => alert("NOT IMPLEMENTED") } as AttachmentMeta);
      case ReferenceType.RESOURCE:
        return this.accountService.getResource(attachment.referenceId).pipe(
            map(resourceDetails => {
                return {
                    name: resourceDetails.name,
                    type: resourceDetails.link ?
                        this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.MESSAGE_CENTER_ATTACHMENTS_TYPE_LINK) :
                        resourceDetails.fileType,
                    // If it is a file, download it and open in a new window
                    viewFunction: () => resourceDetails.resourceType === ResourceType.FILE ?
                        defer(() => this.documentService.downloadDocument(resourceDetails.documentId).pipe(
                            tap(blob => window.open(URL.createObjectURL(blob), "_blank"))
                          )) :
                        // Otherwise it is a link and can just be opened in a new window
                        defer(() => of(resourceDetails.link).pipe(
                            tap(link => window.open(link, "_blank"))
                          ))
                  };
              }),
            first()
          );
      default: // File
        return this.documentService.getDocument(attachment.referenceId).pipe(
            map(documentDetails => {
                return {
                    name: documentDetails.fileName,
                    type: documentDetails.type,
                    viewFunction: () => this.documentService.downloadDocument(attachment.referenceId).pipe(
                        tap(blob => window.open(URL.createObjectURL(blob), "_blank"))
                      )
                  };
              }),
            first()
          );
    }
  }

}
