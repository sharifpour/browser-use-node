[**browser-use-node**](../README.md)

***

[browser-use-node](../globals.md) / DOMService

# Class: DOMService

Service for DOM operations

## Constructors

### new DOMService()

> **new DOMService**(`page`): [`DOMService`](DOMService.md)

#### Parameters

##### page

`Page`

#### Returns

[`DOMService`](DOMService.md)

#### Defined in

[src/dom/service.ts:46](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L46)

## Methods

### buildDOMTreeWithIframes()

> **buildDOMTreeWithIframes**(`root`): `Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)\>

Build DOM tree including iframe content

#### Parameters

##### root

`null` | `ElementHandle`

#### Returns

`Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)\>

#### Defined in

[src/dom/service.ts:837](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L837)

***

### buildDOMTreeWithShadow()

> **buildDOMTreeWithShadow**(`root`): `Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)\>

Build DOM tree with shadow DOM support

#### Parameters

##### root

`null` | `ElementHandle`

#### Returns

`Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)\>

#### Defined in

[src/dom/service.ts:642](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L642)

***

### cleanup()

> **cleanup**(): `Promise`\<`void`\>

Cleanup resources

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/dom/service.ts:54](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L54)

***

### convertToHistoryElement()

> **convertToHistoryElement**(`element`): [`DOMHistoryElement`](../interfaces/DOMHistoryElement.md)

Convert DOM element to history element

#### Parameters

##### element

`unknown`

#### Returns

[`DOMHistoryElement`](../interfaces/DOMHistoryElement.md)

#### Defined in

[src/dom/service.ts:521](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L521)

***

### executeIframeScript()

> **executeIframeScript**\<`T`\>(`iframe`, `script`): `Promise`\<`T`\>

Execute JavaScript in an iframe

#### Type Parameters

• **T**

#### Parameters

##### iframe

`ElementHandle`

##### script

`string`

#### Returns

`Promise`\<`T`\>

#### Defined in

[src/dom/service.ts:802](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L802)

***

### findElement()

> **findElement**(`selector`, `options`): `Promise`\<`null` \| [`DOMElementNode`](../interfaces/DOMElementNode.md)\>

Find single element by selector

#### Parameters

##### selector

[`ElementSelector`](../interfaces/ElementSelector.md)

##### options

`Partial`\<[`DOMQueryOptions`](../interfaces/DOMQueryOptions.md)\> = `{}`

#### Returns

`Promise`\<`null` \| [`DOMElementNode`](../interfaces/DOMElementNode.md)\>

#### Defined in

[src/dom/service.ts:230](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L230)

***

### findElements()

> **findElements**(`selector`, `options`): `Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)[]\>

Find elements by selector

#### Parameters

##### selector

[`ElementSelector`](../interfaces/ElementSelector.md)

##### options

`Partial`\<[`DOMQueryOptions`](../interfaces/DOMQueryOptions.md)\> = `{}`

#### Returns

`Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)[]\>

#### Defined in

[src/dom/service.ts:219](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L219)

***

### findElementsAcrossFrames()

> **findElementsAcrossFrames**(`selector`): `Promise`\<`ElementHandle`[]\>

Find elements across all iframes

#### Parameters

##### selector

`string`

#### Returns

`Promise`\<`ElementHandle`[]\>

#### Defined in

[src/dom/service.ts:901](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L901)

***

### findElementsByEventHandler()

> **findElementsByEventHandler**(`eventType`, `options`): `Promise`\<`object`[]\>

Get all interactive elements with specific event handlers

#### Parameters

##### eventType

`string` | `string`[]

##### options

###### includeHidden

`boolean`

###### includeIframes

`boolean`

###### includeShadowDOM

`boolean`

#### Returns

`Promise`\<`object`[]\>

#### Defined in

[src/dom/service.ts:1679](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L1679)

***

### findElementsByPosition()

> **findElementsByPosition**(`referenceElement`, `position`, `maxDistance`): `Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)[]\>

Find elements by relative position

#### Parameters

##### referenceElement

[`DOMElementNode`](../interfaces/DOMElementNode.md)

##### position

`"above"` | `"below"` | `"left"` | `"right"`

##### maxDistance

`number` = `100`

#### Returns

`Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)[]\>

#### Defined in

[src/dom/service.ts:1225](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L1225)

***

### findElementsByText()

> **findElementsByText**(`text`, `options`): `Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)[]\>

Find elements by fuzzy text match

#### Parameters

##### text

`string`

##### options

###### caseSensitive

`boolean`

###### includeHidden

`boolean`

###### threshold

`number`

#### Returns

`Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)[]\>

#### Defined in

[src/dom/service.ts:1104](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L1104)

***

### findElementsDeep()

> **findElementsDeep**(`selector`, `options`): `Promise`\<`object`[]\>

Find elements across all shadow roots and frames

#### Parameters

##### selector

`string`

##### options

###### includeIframes

`boolean`

###### includeShadowDOM

`boolean`

###### timeout

`number`

###### waitForVisible

`boolean`

#### Returns

`Promise`\<`object`[]\>

#### Defined in

[src/dom/service.ts:1355](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L1355)

***

### findFileUploaders()

> **findFileUploaders**(`options`): `Promise`\<`object`[]\>

Find all file upload elements

#### Parameters

##### options

###### includeHidden

`boolean`

###### includeIframes

`boolean`

###### includeShadowDOM

`boolean`

#### Returns

`Promise`\<`object`[]\>

#### Defined in

[src/dom/service.ts:329](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L329)

***

### findHistoryElement()

> **findHistoryElement**(`element`, `tree`): `null` \| [`DOMElementNode`](../interfaces/DOMElementNode.md)

Find history element in tree

#### Parameters

##### element

[`DOMElementNode`](../interfaces/DOMElementNode.md)

##### tree

[`DOMElementNode`](../interfaces/DOMElementNode.md)

#### Returns

`null` \| [`DOMElementNode`](../interfaces/DOMElementNode.md)

#### Defined in

[src/dom/service.ts:528](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L528)

***

### findVisibleElements()

> **findVisibleElements**(`selector`): `Promise`\<`ElementHandle`[]\>

Find all visible elements matching a selector

#### Parameters

##### selector

`string`

#### Returns

`Promise`\<`ElementHandle`[]\>

#### Defined in

[src/dom/service.ts:1067](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L1067)

***

### getAllIframeElements()

> **getAllIframeElements**(): `Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)[]\>

Get all elements from all iframes

#### Returns

`Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)[]\>

#### Defined in

[src/dom/service.ts:820](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L820)

***

### getClickableElements()

> **getClickableElements**(): `Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)[]\>

Get clickable elements

#### Returns

`Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)[]\>

#### Defined in

[src/dom/service.ts:557](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L557)

***

### getCustomElementDefinition()

> **getCustomElementDefinition**(`element`): `Promise`\<`null` \| \{ `constructor`: `string`; `methods`: `string`[]; `name`: `string`; `observedAttributes`: `string`[]; `properties`: `string`[]; \}\>

Get custom element definition

#### Parameters

##### element

`ElementHandle`

#### Returns

`Promise`\<`null` \| \{ `constructor`: `string`; `methods`: `string`[]; `name`: `string`; `observedAttributes`: `string`[]; `properties`: `string`[]; \}\>

#### Defined in

[src/dom/service.ts:1802](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L1802)

***

### getDOMTree()

> **getDOMTree**(): `Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)\>

Get DOM tree

#### Returns

`Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)\>

#### Defined in

[src/dom/service.ts:565](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L565)

***

### getElementByIndex()

> **getElementByIndex**(`index`): `Promise`\<`null` \| [`DOMElementNode`](../interfaces/DOMElementNode.md)\>

Get element by index

#### Parameters

##### index

`number`

#### Returns

`Promise`\<`null` \| [`DOMElementNode`](../interfaces/DOMElementNode.md)\>

#### Defined in

[src/dom/service.ts:549](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L549)

***

### getElementByXPath()

> **getElementByXPath**(`xpath`): `Promise`\<`null` \| [`DOMElementNode`](../interfaces/DOMElementNode.md)\>

Get element by XPath

#### Parameters

##### xpath

`string`

#### Returns

`Promise`\<`null` \| [`DOMElementNode`](../interfaces/DOMElementNode.md)\>

#### Defined in

[src/dom/service.ts:535](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L535)

***

### getElementsByXPath()

> **getElementsByXPath**(`xpath`): `Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)[]\>

Get elements by XPath

#### Parameters

##### xpath

`string`

#### Returns

`Promise`\<[`DOMElementNode`](../interfaces/DOMElementNode.md)[]\>

#### Defined in

[src/dom/service.ts:542](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L542)

***

### getElementVisibilityInfo()

> **getElementVisibilityInfo**(`element`): `Promise`\<`ElementVisibilityInfo`\>

Get detailed visibility information for an element

#### Parameters

##### element

`ElementHandle`

#### Returns

`Promise`\<`ElementVisibilityInfo`\>

#### Defined in

[src/dom/service.ts:930](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L930)

***

### getEventListeners()

> **getEventListeners**(`element`): `Promise`\<`object`[]\>

Get all event listeners for an element

#### Parameters

##### element

`ElementHandle`

#### Returns

`Promise`\<`object`[]\>

#### Defined in

[src/dom/service.ts:1559](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L1559)

***

### getIframeContent()

> **getIframeContent**(`iframe`): `Promise`\<`null` \| [`DOMElementNode`](../interfaces/DOMElementNode.md)\>

Get iframe content

#### Parameters

##### iframe

`ElementHandle`

#### Returns

`Promise`\<`null` \| [`DOMElementNode`](../interfaces/DOMElementNode.md)\>

#### Defined in

[src/dom/service.ts:740](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L740)

***

### getIframes()

> **getIframes**(): `Promise`\<`ElementHandle`[]\>

Get all iframes in the page

#### Returns

`Promise`\<`ElementHandle`[]\>

#### Defined in

[src/dom/service.ts:733](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L733)

***

### getMostVisibleElement()

> **getMostVisibleElement**(`elements`): `Promise`\<`null` \| `ElementHandle`\>

Get the most visible element from a list of elements

#### Parameters

##### elements

`ElementHandle`[]

#### Returns

`Promise`\<`null` \| `ElementHandle`\>

#### Defined in

[src/dom/service.ts:1083](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L1083)

***

### getSelectorMap()

> **getSelectorMap**(): `Promise`\<`Record`\<`number`, [`DOMElementNode`](../interfaces/DOMElementNode.md)\>\>

Get selector map

#### Returns

`Promise`\<`Record`\<`number`, [`DOMElementNode`](../interfaces/DOMElementNode.md)\>\>

#### Defined in

[src/dom/service.ts:573](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L573)

***

### getShadowRoot()

> **getShadowRoot**(`element`): `Promise`\<`null` \| `ElementHandle`\>

Get shadow root if available

#### Parameters

##### element

`ElementHandle`

#### Returns

`Promise`\<`null` \| `ElementHandle`\>

#### Defined in

[src/dom/service.ts:725](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L725)

***

### getState()

> **getState**(): `Promise`\<[`DOMState`](../interfaces/DOMState.md)\>

Get current DOM state

#### Returns

`Promise`\<[`DOMState`](../interfaces/DOMState.md)\>

#### Defined in

[src/dom/service.ts:207](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L207)

***

### getSynchronizedState()

> **getSynchronizedState**(): `Promise`\<\{ `frames`: `Record`\<`string`, [`DOMState`](../interfaces/DOMState.md)\>; `main`: [`DOMState`](../interfaces/DOMState.md); `shadowRoots`: `Record`\<`string`, [`DOMState`](../interfaces/DOMState.md)\>; \}\>

Get synchronized DOM state across all contexts

#### Returns

`Promise`\<\{ `frames`: `Record`\<`string`, [`DOMState`](../interfaces/DOMState.md)\>; `main`: [`DOMState`](../interfaces/DOMState.md); `shadowRoots`: `Record`\<`string`, [`DOMState`](../interfaces/DOMState.md)\>; \}\>

#### Defined in

[src/dom/service.ts:1447](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L1447)

***

### hasEventHandler()

> **hasEventHandler**(`element`, `eventType`): `Promise`\<`boolean`\>

Check if an element has specific event handlers

#### Parameters

##### element

`ElementHandle`

##### eventType

`string` | `string`[]

#### Returns

`Promise`\<`boolean`\>

#### Defined in

[src/dom/service.ts:1667](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L1667)

***

### isCustomElement()

> **isCustomElement**(`element`): `Promise`\<`boolean`\>

Check if an element is a custom element

#### Parameters

##### element

`ElementHandle`

#### Returns

`Promise`\<`boolean`\>

#### Defined in

[src/dom/service.ts:1793](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L1793)

***

### isElementClickableAtPoint()

> **isElementClickableAtPoint**(`element`, `x`, `y`): `Promise`\<`boolean`\>

Check if an element is clickable at specific coordinates

#### Parameters

##### element

`ElementHandle`

##### x

`number`

##### y

`number`

#### Returns

`Promise`\<`boolean`\>

#### Defined in

[src/dom/service.ts:1050](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L1050)

***

### isElementVisible()

> **isElementVisible**(`element`): `Promise`\<`boolean`\>

Check if an element is visible

#### Parameters

##### element

`ElementHandle`

#### Returns

`Promise`\<`boolean`\>

#### Defined in

[src/dom/service.ts:922](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L922)

***

### isFileUploader()

> **isFileUploader**(`element`): `Promise`\<\{ `acceptTypes`: `string`[]; `isUploader`: `boolean`; `multiple`: `boolean`; `type`: `null` \| `"native"` \| `"custom"` \| `"dragdrop"`; \}\>

Check if element is a file uploader

#### Parameters

##### element

`ElementHandle`

#### Returns

`Promise`\<\{ `acceptTypes`: `string`[]; `isUploader`: `boolean`; `multiple`: `boolean`; `type`: `null` \| `"native"` \| `"custom"` \| `"dragdrop"`; \}\>

#### Defined in

[src/dom/service.ts:241](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L241)

***

### isInShadowDOM()

> **isInShadowDOM**(`element`): `Promise`\<`boolean`\>

Check if an element is in shadow DOM

#### Parameters

##### element

`ElementHandle`

#### Returns

`Promise`\<`boolean`\>

#### Defined in

[src/dom/service.ts:709](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L709)

***

### offMutation()

> **offMutation**(`handler`): `void`

Remove a mutation handler

#### Parameters

##### handler

(`event`) => `void`

#### Returns

`void`

#### Defined in

[src/dom/service.ts:129](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L129)

***

### onMutation()

> **onMutation**(`handler`): `void`

Add a mutation handler

#### Parameters

##### handler

(`event`) => `void`

#### Returns

`void`

#### Defined in

[src/dom/service.ts:122](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L122)

***

### queryIframeSelector()

> **queryIframeSelector**(`iframe`, `selector`): `Promise`\<`null` \| `ElementHandle`\>

Query selector inside an iframe

#### Parameters

##### iframe

`ElementHandle`

##### selector

`string`

#### Returns

`Promise`\<`null` \| `ElementHandle`\>

#### Defined in

[src/dom/service.ts:784](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L784)

***

### queryIframeSelectorAll()

> **queryIframeSelectorAll**(`iframe`, `selector`): `Promise`\<`ElementHandle`[]\>

Query selector all inside an iframe

#### Parameters

##### iframe

`ElementHandle`

##### selector

`string`

#### Returns

`Promise`\<`ElementHandle`[]\>

#### Defined in

[src/dom/service.ts:793](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L793)

***

### querySelectorAllDeep()

> **querySelectorAllDeep**(`selector`): `Promise`\<`ElementHandle`[]\>

Query selector all with shadow DOM support

#### Parameters

##### selector

`string`

#### Returns

`Promise`\<`ElementHandle`[]\>

#### Defined in

[src/dom/service.ts:608](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L608)

***

### querySelectorDeep()

> **querySelectorDeep**(`selector`): `Promise`\<`null` \| `ElementHandle`\>

Query selector with shadow DOM support

#### Parameters

##### selector

`string`

#### Returns

`Promise`\<`null` \| `ElementHandle`\>

#### Defined in

[src/dom/service.ts:581](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L581)

***

### removeHighlights()

> **removeHighlights**(): `Promise`\<`void`\>

Remove highlights from the page

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/dom/service.ts:81](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L81)

***

### startObserving()

> **startObserving**(): `Promise`\<`void`\>

Start observing DOM mutations

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/dom/service.ts:108](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L108)

***

### stopObserving()

> **stopObserving**(): `Promise`\<`void`\>

Stop observing DOM mutations

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/dom/service.ts:115](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L115)

***

### triggerCustomEvent()

> **triggerCustomEvent**(`element`, `eventType`, `detail`): `Promise`\<`void`\>

Simulate custom events on an element

#### Parameters

##### element

`ElementHandle`

##### eventType

`string`

##### detail

`Record`\<`string`, `unknown`\> = `{}`

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/dom/service.ts:1772](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L1772)

***

### uploadFiles()

> **uploadFiles**(`element`, `files`, `options`): `Promise`\<`void`\>

Upload files to an uploader element

#### Parameters

##### element

`ElementHandle`

##### files

`object`[]

##### options

###### checkAcceptTypes

`boolean`

###### simulateDragDrop

`boolean`

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/dom/service.ts:416](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L416)

***

### waitForAttributeChange()

> **waitForAttributeChange**(`selector`, `attributeName`, `timeout`?): `Promise`\<`void`\>

Wait for an attribute to change on an element

#### Parameters

##### selector

`string`

##### attributeName

`string`

##### timeout?

`number`

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/dom/service.ts:159](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L159)

***

### waitForDynamicContent()

> **waitForDynamicContent**(`options`): `Promise`\<`void`\>

Wait for dynamic content to be loaded

#### Parameters

##### options

###### predicate

(`state`) => `boolean`

###### selector

`string`

###### timeout

`number`

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/dom/service.ts:170](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L170)

***

### waitForElement()

> **waitForElement**(`selector`, `timeout`?): `Promise`\<`void`\>

Wait for a specific element to be added to the DOM

#### Parameters

##### selector

`string`

##### timeout?

`number`

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/dom/service.ts:145](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L145)

***

### waitForElementClickable()

> **waitForElementClickable**(`selector`, `timeout`): `Promise`\<`ElementHandle`\>

Wait for an element to become clickable

#### Parameters

##### selector

`string`

##### timeout

`number` = `30000`

#### Returns

`Promise`\<`ElementHandle`\>

#### Defined in

[src/dom/service.ts:1026](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L1026)

***

### waitForElementRemoval()

> **waitForElementRemoval**(`selector`, `timeout`?): `Promise`\<`void`\>

Wait for an element to be removed from the DOM

#### Parameters

##### selector

`string`

##### timeout?

`number`

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/dom/service.ts:152](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L152)

***

### waitForElementVisible()

> **waitForElementVisible**(`selector`, `timeout`): `Promise`\<`ElementHandle`\>

Wait for an element to become visible

#### Parameters

##### selector

`string`

##### timeout

`number` = `30000`

#### Returns

`Promise`\<`ElementHandle`\>

#### Defined in

[src/dom/service.ts:1009](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L1009)

***

### waitForIframeLoad()

> **waitForIframeLoad**(`iframe`, `timeout`): `Promise`\<`void`\>

Wait for iframe to load

#### Parameters

##### iframe

`ElementHandle`

##### timeout

`number` = `30000`

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/dom/service.ts:811](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/dom/service.ts#L811)
