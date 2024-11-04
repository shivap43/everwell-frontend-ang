# date

This library is responsible for dealing with all date-related functions.

Functions may use `MomentJS` or `date-fns`. The goal of this lib is to remove the `MomentJS` import outside of this lib so that `MomentJS` can eventually be removed.

## Refactor Process

1. Target file outside of `date` lib that imports `MomentJS`:

```typescript
// Example: anything that imports from `moment` dependency
import moment from "moment"; // <-- goal is to remove this line

// ...

class MyComponent {
    constructor(private readonly dateService: DateService) {}

    dateValidation(): void {
        const dependentAge = moment().diff(date, "years"); // <-- this line uses moment
        // ...
    }
}
```

2. Migrate logic to `DateService`:

```typescript
export class DateService {
    // ...

    /**
     * Get number of years before current date
     */
    getYearsFromNow(date: Date | number): number {
        return moment().diff(date, "years");
    }
}
```

3. Refactor file to use `DateService` instead

```typescript
class MyComponent {
    constructor(private readonly dateService: DateService) {}

    dateValidation(): void {
        const dependentAge = dateService.getYearsFromNow(dateInput);
        // ...
    }
}
```

4. Remove `MomentJS` import:

```typescript
import moment from "moment"; // <-- remove this line
```

5. Write unit tests for `DateService` to confirm current behavior of migrated code:

```typescript
describe("getYearsFromNow()", () => {
    it("should return the difference in time from now to date in years", () => {
        jest.useFakeTimers("modern"); // Allow for mocking the system clock
        jest.setSystemTime(parseISO("1995-03-07").valueOf()); // Set the current system clock regardless of timezone

        expect(service.getYearsFromNow(parseISO("1985-04-13"))).toBe(9);
        expect(service.getYearsFromNow(parseISO("1985-04-13")).valueOf()).toBe(
            9
        );
    });
});
```

6. Refactor migrated code to use `date-fns` instead of `MomentJS` (Optional until `MomentJS` has fully been migrated to `date` lib):

```typescript
export class DateService {
    // ...

    /**
     * Get number of years before current date
     */
    getYearsFromNow(date: Date | number): number {
        // return moment().diff(date, "years");// <-- remove moment logic
        return differenceInYears(0, date); // <-- refactor to use date-fns instead
    }
}
```

## After Refactor Process

Once every import for `MomentJS` has been removed outside of the `date` lib, the next steps are:

1. Refactor logic that uses `MomentJS` to use `date-fns` instead:

```typescript
export class DateService {
    // ...

    /**
     * Get number of years before current date
     */
    getYearsFromNow(date: Date | number): number {
        // return moment().diff(date, "years");// <-- remove moment logic
        return differenceInYears(0, date); // <-- refactor to use date-fns instead
    }
}
```

2. Once `MomentJS` is no longer used in `DateService`, remove import for `MomentJS`

3. Delete `MomentService` found at `libs/date/src/lib/services/moment` as it shouldn't have any purpose now since there's no need for `MomentJS` helpers.

4. Delete `libs/shared/src/lib/material/moment-utc-date-adapter.ts` and clean up code that uses it.

5. Remove `MomentModule` from `AppModule` found at `apps/client/src/app/app.module.ts`

6. Remove `MomentJS` related dependencies from project:

`npm uninstall angular2-moment @angular/material-moment-adapter moment`

6. Verify that `npm run build`, `npm run test`, `npm run serve` all work as expected.

This completes the removal of `MomentJS`.

## Running Unit Tests

Run `nx test date` to execute the unit tests.

## Debugging Common Issues

A common error you will see when trying to inject the `DateService` in a `Component` or `Service` using Dependency Inject is:

```bash
No suitable injection token for parameter 'dateService' of class 'AddCustomerComponent'.
  Consider using the @Inject decorator to specify an injection token.
```

This is a false error that is resolved by reloading vscode:
`shift` + `cmd` + `p` > Developer: Reload Window (mac)
`shift` + `ctrl` + `p` > Developer: Reload Window (windows)
