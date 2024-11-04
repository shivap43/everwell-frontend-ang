## Title: Chip Component Usage

## Author: Tim Nowaczewski / Judson Terrell

Can be used with data-binding...

```html
<div class="container">
    <div class="col col-6">
        <empowered-chip-select
            [chipOptions$]="allRegionChips$"
            [initSelectedChips]="selectedValues"
            (chipChange)="monitorChipChange($event)"
        >
        </empowered-chip-select>
    </div>
</div>
```

...Or dynamic view child rendering

```javascript
    states = [
        { name: "Arkansas", value: "1" },
        { name: "South Carolina", value: "2" },
        { name: "Florida", value: "3" },
        { name: "California", value: "4" },
      ];

    selectedStates: string[] = ["1"];

    @ViewChild(ChipSelectComponent) chipSelect: ChipSelectComponent;

    constructor(){}

    ngOnInit(): void {
        this.chipSelect.setChipOptions(of(this.states)); // call the setChipOptions function in the chipselect component.

        this.chipSelect.setSelectedChips(selectedStates); // preselect the chip for "Arkansas"
    }

    someMethodThatTriggerClearing(): void {
      this.chipSelect.clear(); // clear the chip select values
    }

    monitorChipChange(event: Event): void {
      // whatever logic is needed when realizing the chip control has changed its values
      // refer to the html example above
    }
```

## Please note interface:

```javascript
export interface ChipSelectOption {
    name: string;
    value: string;
}
```
