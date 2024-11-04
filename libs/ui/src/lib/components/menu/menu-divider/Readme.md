# Menu UI Componant

# Author: Rahul Sanap

# menu-component is used to provide material menu in the application, where it is capable of providing

# menu with Menu trigger button with text, text and icon or icon only. Example of each type is mentioned below.

`@Example`

1.Usage of Default items in menu

```html
<empowered-menu [menuName]="'<nameOfMenu>'">
    <empowered-menu-item [name]="'<nameOfItem>'"></empowered-menu-item>
    <empowered-menu-item [name]="'<nameOfItem>'"></empowered-menu-item>
</empowered-menu>
```

2.Usage of Default and Danger menu items with divider

```html
<empowered-menu [menuName]="'<nameOfMenu>'">
    <empowered-menu-item [name]="'<nameOfItem>'"></empowered-menu-item>
    <empowered-menu-item [name]="'<nameOfItem>'"></empowered-menu-item>
    <empowered-menu-divider></empowered-menu-divider>
    <empowered-menu-item
        [type]="'danger'"
        [name]="'<nameOfItem>'"
    ></empowered-menu-item>
    <empowered-menu-item
        [type]="'danger'"
        [name]="'<nameOfItem>'"
    ></empowered-menu-item>
</empowered-menu>
```

3. Usage of Menu Trigger Button with text and icon

```html
<empowered-menu [menuName]="'<nameOfMenu>'">
    <mat-icon svgIcon="<name>"></mat-icon>
    <empowered-menu-item [name]="'<nameOfItem>'"></empowered-menu-item>
    <empowered-menu-item [name]="'<nameOfItem>'"></empowered-menu-item>
</empowered-menu>
```

4. Usage of Menu Trigger Button icon only

```html
<empowered-menu>
    <mat-icon svgIcon="<name>"></mat-icon>
    <empowered-menu-item [name]="'<nameOfItem>'"></empowered-menu-item>
    <empowered-menu-item [name]="'<nameOfItem>'"></empowered-menu-item>
</empowered-menu>
```

5. Usage of X-Position for menu

```html
<empowered-menu xPosition="before|after">
    <mat-icon svgIcon="<name>"></mat-icon>
    <empowered-menu-item [name]="'<nameOfItem>'"></empowered-menu-item>
    <empowered-menu-item [name]="'<nameOfItem>'"></empowered-menu-item>
</empowered-menu>
```

6. Usage of Y-Position for menu

```html
<empowered-menu yPosition="below|above">
    <mat-icon svgIcon="<name>"></mat-icon>
    <empowered-menu-item [name]="'<nameOfItem>'"></empowered-menu-item>
    <empowered-menu-item [name]="'<nameOfItem>'"></empowered-menu-item>
</empowered-menu>
```

7. Usage of x-Position and Y-Position together

```html
<empowered-menu xPosition="before|after" yPosition="below|above">
    <mat-icon svgIcon="<name>"></mat-icon>
    <empowered-menu-item [name]="'<nameOfItem>'"></empowered-menu-item>
    <empowered-menu-item [name]="'<nameOfItem>'"></empowered-menu-item>
</empowered-menu>
```

> `NOTE`: In above example replace all angle bracket `<` text with your string value.

<empowered-menu> is used to define material menu
<empowered-menu-item> is used to define menu item
<empowered-dotted-divider> is used to specify the divider between two different items

> `@param`
> menuName is used to provide menu name
> `@param`
> name is use provide name of item in the menu list
> `@param`
> type specify the type of item , by default it is Default
> `@param`
> x-Position By default, the menu will display after (x-axis), without overlapping its trigger.
> The position can be changed using the xPosition (before | after) attribute.
> `@param`
> y-Position By default, the menu will display below (y-axis) without overlapping its trigger.
> The position can be changed using the yPosition (above | below) attribute.

-   after: to the right side of button
-   before: to the left side of button
-   below: below the button
-   above: above the button

<mat-icon svgIcon="<name>"></mat-icon> is used to display material icon for menu trigger button

# @see Example https://zeroheight.com/0ydh214/p/8851ba-contextual-menu/b/89b41
