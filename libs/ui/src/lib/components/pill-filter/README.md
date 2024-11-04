# Pill Filter

### Author: Tim Nowaczewski

Make a list of `FilterModel`s to use as an input for the filters

```javascript
filterModels$ = of([
    {
        id: "1",
        title: "MultiSelect filter",
        multi: {
            isChip: false,
            options: [
                {
                    label: "Box 1",
                    value: "1",
                },
                {
                    label: "Box 2",
                    value: "2",
                },
            ],
        },
    },
    {
        id: "2",
        title: "SingleSelect filter",
        single: {
            default: "3",
            options: [
                {
                    label: "Option 1",
                    value: "1",
                },
                {
                    label: "Option 2",
                    value: "2",
                },
                {
                    label: "Option 3",
                    value: "3",
                },
            ],
        },
    },
    {
        id: "3",
        title: "Search Filter",
        search: {
            value: "TEST",
        },
    },
]);
```

...and pass the model into the filter group

```html
<empowered-pill-filter-group
    [filterModels$]="filterModels$"
    (filterChange)="onChange($event)"
></empowered-pill-filter-group>
```

The `filterChange` event will emit the initial selections, and then again whenever this selections update.
