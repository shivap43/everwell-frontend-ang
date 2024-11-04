# Material Menu

### Author: Stephen Stroud

Requirements:

-   In a material menu, each mat-menu-item will be a button.
-   Aria-labels should be added only to focusable items with no text.

Example 1: If all mat-menu-items will always be displayed (no use of structural directives,
such as: \*ngIf, configEnable, hasPermission, etc.), then add them as you normally would:

```html
<!-- optional attribute for mat-menu to specify menu position relative to trigger:
xPosition="before/after" -->
<button
    mat-flat-button
    class="mon-btn-secondary btn-sm pull-down-sm"
    [matMenuTriggerFor]="menu"
    language="language_specification"
>
    <mon-icon
        [iconSize]="8"
        iconName="arrow-1-down"
        class="icon-right"
    ></mon-icon>
</button>

<mat-menu #menu="matMenu">
    <button
        mat-menu-item
        (click)="callback()"
        language="language_specification"
    ></button>
    ...(etc)...
</mat-menu>
```

Example 2: If any mat-menu-item needs to be displayed conditionally (with use of structural
directives, such as: \*ngIf, configEnable, hasPermission, etc.), create an observable to pass
every item in asynchronously. This prevents inconsistent keyboard navigation:

```typescript
private readonly asyncMenuItemsSubject$: Subject<AsyncMenuItem[]> = new Subject<AsyncMenuItem[]>();
protected readonly asyncMenuItems$: Observable<AsyncMenuItem[]> = this.asyncMenuItemsSubject$.asObservable();

...

/**
 * Returns an array of menu options based on the condition(s) value passed in.
 * <--- Note to developer: call this whenever any condition changes. --->
 *
 * @param condition1 condition upon which final status of menu relies
 * @param ...
 * @returns AsyncMenuItem[] an array of menu items populated asynchronously
 */
getAsyncMenuItems(condition1: boolean, ...): AsyncMenuItem[] {
    return [
        {
            label: "<language_specification>",
            condition: boolean variable or expression,
            callback: (optional_params) => this.callback(optional_params),
        },
        ...(etc)...
    ];
}

/**
 * Receives a menu option callback function and calls it.
 *
 * @param callback the function to be called based on menu selection
 */
dispatchAsyncMenuItemCallback(callback: AsyncMenuItem["callback"]): void {
    callback();
}
```

...and pass each label, condition, and callback into the template

```html
<button
    mat-flat-button
    class="mon-btn-secondary btn-sm pull-down-sm"
    [matMenuTriggerFor]="asyncMenu"
>
    <span>{{ menu_label }}</span>
    <mon-icon
        [iconSize]="8"
        iconName="arrow-1-down"
        class="icon-right"
    ></mon-icon>
</button>

<!-- optional attribute for mat-menu to specify menu position relative to trigger:
xPosition="before/after" -->
<mat-menu #asyncMenu="matMenu">
    <!-- wrapping button with ng-container allows use of *ngIf and *ngFor directives,
  one element cannot contain more than one structural directive -->
    <ng-container *ngFor="let asyncMenuItem of asyncMenuItem$ | async">
        <button
            mat-menu-item
            *ngIf="asyncMenuItem.condition"
            (click)="dispatchAddAdminCallback(asyncMenuItem.callback)"
            language="asyncMenuItem.label"
        ></button>
    </ng-container>
</mat-menu>
```
