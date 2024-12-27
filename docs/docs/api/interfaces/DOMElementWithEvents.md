[**browser-use-node**](../README.md)

***

[browser-use-node](../globals.md) / DOMElementWithEvents

# Interface: DOMElementWithEvents

DOM element with event info

## Extends

- [`DOMElementNode`](DOMElementNode.md)

## Properties

### attributes

> **attributes**: `Record`\<`string`, `string`\>

Element attributes

#### Inherited from

[`DOMElementNode`](DOMElementNode.md).[`attributes`](DOMElementNode.md#attributes)

#### Defined in

[src/dom/types.ts:64](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L64)

***

### children

> **children**: [`DOMBaseNode`](DOMBaseNode.md)[]

Child elements

#### Inherited from

[`DOMElementNode`](DOMElementNode.md).[`children`](DOMElementNode.md#children)

#### Defined in

[src/dom/types.ts:69](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L69)

***

### context?

> `optional` **context**: [`ElementContext`](ElementContext.md)

Element context

#### Defined in

[src/dom/types.ts:294](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L294)

***

### customElement?

> `optional` **customElement**: [`CustomElementDefinition`](CustomElementDefinition.md)

Custom element info

#### Defined in

[src/dom/types.ts:284](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L284)

***

### eventListeners?

> `optional` **eventListeners**: [`EventListenerInfo`](EventListenerInfo.md)[]

Event listeners

#### Defined in

[src/dom/types.ts:279](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L279)

***

### fileUploader?

> `optional` **fileUploader**: [`FileUploaderInfo`](FileUploaderInfo.md)

File uploader info

#### Defined in

[src/dom/types.ts:289](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L289)

***

### hash?

> `optional` **hash**: `HashedDomElement`

Element hash

#### Inherited from

[`DOMElementNode`](DOMElementNode.md).[`hash`](DOMElementNode.md#hash)

#### Defined in

[src/dom/types.ts:29](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L29)

***

### highlightIndex?

> `optional` **highlightIndex**: `number`

Element highlight index

#### Inherited from

[`DOMElementNode`](DOMElementNode.md).[`highlightIndex`](DOMElementNode.md#highlightindex)

#### Defined in

[src/dom/types.ts:89](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L89)

***

### id?

> `optional` **id**: `string`

Element ID

#### Inherited from

[`DOMElementNode`](DOMElementNode.md).[`id`](DOMElementNode.md#id)

#### Defined in

[src/dom/types.ts:24](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L24)

***

### isClickable

> **isClickable**: `boolean`

Whether the element is clickable

#### Inherited from

[`DOMElementNode`](DOMElementNode.md).[`isClickable`](DOMElementNode.md#isclickable)

#### Defined in

[src/dom/types.ts:104](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L104)

***

### isIframe?

> `optional` **isIframe**: `boolean`

Whether the element is an iframe

#### Inherited from

[`DOMElementNode`](DOMElementNode.md).[`isIframe`](DOMElementNode.md#isiframe)

#### Defined in

[src/dom/types.ts:109](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L109)

***

### isInteractive

> **isInteractive**: `boolean`

Whether the element is interactive

#### Inherited from

[`DOMElementNode`](DOMElementNode.md).[`isInteractive`](DOMElementNode.md#isinteractive)

#### Defined in

[src/dom/types.ts:74](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L74)

***

### isTopElement

> **isTopElement**: `boolean`

Whether the element is a top element

#### Inherited from

[`DOMElementNode`](DOMElementNode.md).[`isTopElement`](DOMElementNode.md#istopelement)

#### Defined in

[src/dom/types.ts:79](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L79)

***

### isVisible

> **isVisible**: `boolean`

Whether the element is visible

#### Inherited from

[`DOMElementNode`](DOMElementNode.md).[`isVisible`](DOMElementNode.md#isvisible)

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

#### Inherited from

[`DOMElementNode`](DOMElementNode.md).[`location`](DOMElementNode.md#location)

#### Defined in

[src/dom/types.ts:94](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L94)

***

### parent

> **parent**: `null` \| [`DOMElementNode`](DOMElementNode.md)

Parent element

#### Inherited from

[`DOMElementNode`](DOMElementNode.md).[`parent`](DOMElementNode.md#parent)

#### Defined in

[src/dom/types.ts:19](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L19)

***

### shadowRoot

> **shadowRoot**: `boolean`

Whether the element has a shadow root

#### Inherited from

[`DOMElementNode`](DOMElementNode.md).[`shadowRoot`](DOMElementNode.md#shadowroot)

#### Defined in

[src/dom/types.ts:84](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L84)

***

### tagName

> **tagName**: `string`

Element tag name

#### Inherited from

[`DOMElementNode`](DOMElementNode.md).[`tagName`](DOMElementNode.md#tagname)

#### Defined in

[src/dom/types.ts:54](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L54)

***

### xpath

> **xpath**: `string`

Element XPath

#### Inherited from

[`DOMElementNode`](DOMElementNode.md).[`xpath`](DOMElementNode.md#xpath)

#### Defined in

[src/dom/types.ts:59](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/types.ts#L59)
