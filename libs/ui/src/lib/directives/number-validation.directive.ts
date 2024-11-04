import { AfterViewInit, Directive, ElementRef, HostListener, Input } from "@angular/core";

const KEYPRESS = "keypress";
const PASTE = "paste";
const INPUT = "input";
const EVENT = "$event";
const INSERT_FROM_PASTE = "insertFromPaste";

const MIN_NUMBER_CHARACTER_CODE = 48;
const MAX_NUMBER_CHARACTER_CODE = 57;
const KEYCODE_FOR_DOT = 46;
const KEYCODE_FOR_DASH = 45;

@Directive({
    selector: "[empoweredNumberValidation]",
})
export class NumberValidationDirective implements AfterViewInit {
    @Input() allowDecimals: boolean;
    @Input() allowDashes: boolean;

    currentValue: string;
    pasteText: string;

    /**
     * Constructor of class.
     * @param host reference to element to which directive is attached
     */
    constructor(private readonly host: ElementRef) {}

    /**
     * Get default/updated value of input.
     */
    ngAfterViewInit(): void {
        this.currentValue = this.host.nativeElement.value;
    }

    /**
     * Restrict user to type numbers only.
     * @param keyPressEvent Keyboard event
     */
    @HostListener(KEYPRESS, [EVENT])
    onKeypress(keyPressEvent: KeyboardEvent): void {
        const charCode = keyPressEvent.key ? keyPressEvent.key.toString().charCodeAt(0) : null;
        if (!this.checkCharacterValidity(charCode)) {
            keyPressEvent.preventDefault();
        }
    }

    /**
     * Get value of paste event.
     * @param pasteEvent event with paste data
     */
    @HostListener(PASTE, [EVENT])
    onPaste(pasteEvent: ClipboardEvent): void {
        this.pasteText = pasteEvent.clipboardData.getData("Text");
    }

    /**
     * Handle paste and autocomplete input events.
     * @param inputEvent event with input data
     */
    @HostListener(INPUT, [EVENT])
    onInput(inputEvent: any): void {
        if (
            inputEvent.inputType === INSERT_FROM_PASTE &&
            this.pasteText.split("").some((character) => !this.checkCharacterValidity(character.charCodeAt(0)))
        ) {
            // restore value on erroneous paste
            this.host.nativeElement.value = this.currentValue;
        } else if (
            this.host.nativeElement.value.split("").some((character: string) => !this.checkCharacterValidity(character.charCodeAt(0)))
        ) {
            // disable erroneous autocomplete
            this.host.nativeElement.value = "";
        } else {
            // record valid input
            this.currentValue = this.host.nativeElement.value;
        }
    }

    /**
     * Check whether character is numeric or a decimal or dash (if allowed).
     * @param charCode character code
     * @returns result of check
     */
    checkCharacterValidity(charCode: number): boolean {
        return (
            charCode &&
            ((charCode <= MAX_NUMBER_CHARACTER_CODE && charCode >= MIN_NUMBER_CHARACTER_CODE) ||
                (this.allowDecimals && charCode === KEYCODE_FOR_DOT) ||
                (this.allowDashes && charCode === KEYCODE_FOR_DASH))
        );
    }
}
