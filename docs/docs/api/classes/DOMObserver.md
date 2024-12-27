[**browser-use-node**](../README.md)

***

[browser-use-node](../globals.md) / DOMObserver

# Class: DOMObserver

DOM observer for monitoring page elements

## Constructors

### new DOMObserver()

> **new DOMObserver**(`page`): [`DOMObserver`](DOMObserver.md)

#### Parameters

##### page

`Page`

#### Returns

[`DOMObserver`](DOMObserver.md)

#### Defined in

[src/dom/observer.ts:27](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/observer.ts#L27)

## Methods

### findElements()

> **findElements**(`selector`, `options`): `Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)[]\>

Find elements by selector

#### Parameters

##### selector

[`ElementSelector`](../interfaces/ElementSelector.md)

##### options

[`DOMQueryOptions`](../interfaces/DOMQueryOptions.md) = `DEFAULT_QUERY_OPTIONS`

#### Returns

`Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)[]\>

#### Defined in

[src/dom/observer.ts:52](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/observer.ts#L52)

***

### getClickableElements()

> **getClickableElements**(`includeHidden`): `Promise`\<[`DOMObservation`](../interfaces/DOMObservation.md)\>

Get clickable elements and DOM tree

#### Parameters

##### includeHidden

`boolean` = `false`

#### Returns

`Promise`\<[`DOMObservation`](../interfaces/DOMObservation.md)\>

#### Defined in

[src/dom/observer.ts:34](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/observer.ts#L34)
