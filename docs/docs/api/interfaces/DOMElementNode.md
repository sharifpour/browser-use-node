[**browser-use-node**](../README.md)

***

[browser-use-node](../globals.md) / DOMElementNode

# Interface: DOMElementNode

DOM element node

## Extends

- [`DOMBaseNode`](DOMBaseNode.md)

## Extended by

- [`DOMElementWithEvents`](DOMElementWithEvents.md)

## Properties

### attributes

> **attributes**: `Record`\<`string`, `string`\>

Element attributes

#### Defined in

[src/dom/types.ts:64](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L64)

***

### children

> **children**: [`DOMBaseNode`](DOMBaseNode.md)[]

Child elements

#### Defined in

[src/dom/types.ts:69](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L69)

***

### hash?

> `optional` **hash**: `HashedDomElement`

Element hash

#### Inherited from

[`DOMBaseNode`](DOMBaseNode.md).[`hash`](DOMBaseNode.md#hash)

#### Defined in

[src/dom/types.ts:29](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L29)

***

### highlightIndex?

> `optional` **highlightIndex**: `number`

Element highlight index

#### Defined in

[src/dom/types.ts:89](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L89)

***

### id?

> `optional` **id**: `string`

Element ID

#### Inherited from

[`DOMBaseNode`](DOMBaseNode.md).[`id`](DOMBaseNode.md#id)

#### Defined in

[src/dom/types.ts:24](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L24)

***

### isClickable

> **isClickable**: `boolean`

Whether the element is clickable

#### Defined in

[src/dom/types.ts:104](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L104)

***

### isIframe?

> `optional` **isIframe**: `boolean`

Whether the element is an iframe

#### Defined in

[src/dom/types.ts:109](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L109)

***

### isInteractive

> **isInteractive**: `boolean`

Whether the element is interactive

#### Defined in

[src/dom/types.ts:74](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L74)

***

### isTopElement

> **isTopElement**: `boolean`

Whether the element is a top element

#### Defined in

[src/dom/types.ts:79](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L79)

***

### isVisible

> **isVisible**: `boolean`

Whether the element is visible

#### Inherited from

[`DOMBaseNode`](DOMBaseNode.md).[`isVisible`](DOMBaseNode.md#isvisible)

#### Defined in

[src/dom/types.ts:14](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L14)

***

### location?

> `optional` **location**: `object`

Element location

#### height

> **height**: `number`

#### width

> **width**: `number`

#### x

> **x**: `number`

#### y

> **y**: `number`

#### Defined in

[src/dom/types.ts:94](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L94)

***

### parent

> **parent**: `null` \| [`DOMElementNode`](DOMElementNode.md)

Parent element

#### Inherited from

[`DOMBaseNode`](DOMBaseNode.md).[`parent`](DOMBaseNode.md#parent)

#### Defined in

[src/dom/types.ts:19](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L19)

***

### shadowRoot

> **shadowRoot**: `boolean`

Whether the element has a shadow root

#### Defined in

[src/dom/types.ts:84](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L84)

***

### tagName

> **tagName**: `string`

Element tag name

#### Defined in

[src/dom/types.ts:54](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L54)

***

### xpath

> **xpath**: `string`

Element XPath

#### Defined in

[src/dom/types.ts:59](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L59)
