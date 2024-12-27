[**browser-use-node**](../README.md)

***

[browser-use-node](../globals.md) / BrowserContext

# Class: BrowserContext

Browser context with enhanced capabilities

## Constructors

### new BrowserContext()

> **new BrowserContext**(`browser`, `config`): [`BrowserContext`](BrowserContext.md)

#### Parameters

##### browser

[`Browser`](Browser.md)

##### config

`Partial`\<`BrowserContextConfig`\> = `{}`

#### Returns

[`BrowserContext`](BrowserContext.md)

#### Defined in

[src/browser/context.ts:124](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L124)

## Accessors

### pages

#### Get Signature

> **get** **pages**(): [`number`, `Page`][]

Get all pages in the context

##### Returns

[`number`, `Page`][]

#### Defined in

[src/browser/context.ts:329](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L329)

## Methods

### addEventListener()

> **addEventListener**\<`T`\>(`eventType`, `handler`, `options`): `Promise`\<`void`\>

Add an event listener for a specific page event with error handling

#### Type Parameters

• **T** *extends* [`PageEventType`](../type-aliases/PageEventType.md)

#### Parameters

##### eventType

`T`

##### handler

[`PageEventHandler`](../type-aliases/PageEventHandler.md)\[`T`\]

##### options

###### once

`boolean`

###### timeout

`number`

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:1840](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1840)

***

### addRequestInterceptor()

> **addRequestInterceptor**(`interceptor`): `void`

Add a request interceptor with validation

#### Parameters

##### interceptor

[`RequestInterceptor`](../interfaces/RequestInterceptor.md)

#### Returns

`void`

#### Defined in

[src/browser/context.ts:1655](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1655)

***

### addResponseInterceptor()

> **addResponseInterceptor**(`interceptor`): `void`

Add a response interceptor with validation

#### Parameters

##### interceptor

[`ResponseInterceptor`](../interfaces/ResponseInterceptor.md)

#### Returns

`void`

#### Defined in

[src/browser/context.ts:1740](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1740)

***

### blockRequests()

> **blockRequests**(`urlPattern`): `Promise`\<`void`\>

Block requests matching a URL pattern

#### Parameters

##### urlPattern

`string` | `RegExp`

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:1782](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1782)

***

### cleanup()

> **cleanup**(): `Promise`\<`void`\>

Cleanup when object is destroyed

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:300](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L300)

***

### clearAllEventListeners()

> **clearAllEventListeners**(): `Promise`\<`void`\>

Clear all event listeners

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:1939](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1939)

***

### clearCookies()

> **clearCookies**(): `Promise`\<`void`\>

Clear all cookies from the current context

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:1522](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1522)

***

### clearRequestInterceptors()

> **clearRequestInterceptors**(): `void`

Clear all request interceptors

#### Returns

`void`

#### Defined in

[src/browser/context.ts:1688](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1688)

***

### clearResponseInterceptors()

> **clearResponseInterceptors**(): `void`

Clear all response interceptors

#### Returns

`void`

#### Defined in

[src/browser/context.ts:1773](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1773)

***

### close()

> **close**(): `Promise`\<`void`\>

Close the browser context and clean up resources

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:239](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L239)

***

### closeCurrentTab()

> **closeCurrentTab**(): `Promise`\<`void`\>

Close the current tab

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:945](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L945)

***

### createNewTab()

> **createNewTab**(`url`?): `Promise`\<`void`\>

Create a new tab

#### Parameters

##### url?

`string`

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:889](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L889)

***

### deleteCookies()

> **deleteCookies**(`names`): `Promise`\<`void`\>

Delete specific cookies by name

#### Parameters

##### names

`string`[]

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:1537](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1537)

***

### enter()

> **enter**(): `Promise`\<[`BrowserContext`](BrowserContext.md)\>

Async context manager entry

#### Returns

`Promise`\<[`BrowserContext`](BrowserContext.md)\>

#### Defined in

[src/browser/context.ts:150](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L150)

***

### executeJavaScript()

> **executeJavaScript**\<`T`\>(`script`, `options`): `Promise`\<`T`\>

Execute JavaScript code on the page with proper error handling and timeout

#### Type Parameters

• **T**

#### Parameters

##### script

`string`

##### options

###### args

`any`[]

###### returnByValue

`boolean`

###### timeout

`number`

#### Returns

`Promise`\<`T`\>

#### Defined in

[src/browser/context.ts:1013](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1013)

***

### exit()

> **exit**(`error`?): `Promise`\<`void`\>

Async context manager exit

#### Parameters

##### error?

`Error`

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:158](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L158)

***

### exportCookies()

> **exportCookies**(): `Promise`\<`string`\>

Export cookies to a JSON string

#### Returns

`Promise`\<`string`\>

#### Defined in

[src/browser/context.ts:1567](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1567)

***

### getConfig()

> **getConfig**(): `BrowserContextConfig`

Get the config

#### Returns

`BrowserContextConfig`

#### Defined in

[src/browser/context.ts:810](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L810)

***

### getCookies()

> **getCookies**(): `Promise`\<`Cookie`[]\>

Get all cookies for the current context

#### Returns

`Promise`\<`Cookie`[]\>

#### Defined in

[src/browser/context.ts:1463](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1463)

***

### getCookiesForUrl()

> **getCookiesForUrl**(`url`): `Promise`\<`Cookie`[]\>

Get cookies for a specific URL

#### Parameters

##### url

`string`

#### Returns

`Promise`\<`Cookie`[]\>

#### Defined in

[src/browser/context.ts:1478](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1478)

***

### getDomElementByIndex()

> **getDomElementByIndex**(`index`): `Promise`\<`null` \| [`DOMElementNode`](../interfaces/DOMElementNode.md)\>

Get DOM element by index with validation

#### Parameters

##### index

`number`

#### Returns

`Promise`\<`null` \| [`DOMElementNode`](../interfaces/DOMElementNode.md)\>

#### Defined in

[src/browser/context.ts:1124](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1124)

***

### getElementByIndex()

> **getElementByIndex**(`index`): `Promise`\<`null` \| `ElementHandle`\<`Element`\>\>

Get element by index with retry logic for stale elements

#### Parameters

##### index

`number`

#### Returns

`Promise`\<`null` \| `ElementHandle`\<`Element`\>\>

#### Defined in

[src/browser/context.ts:1079](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1079)

***

### getLocateElement()

> **getLocateElement**(`element`): `Promise`\<`null` \| `ElementHandle`\>

Get element handle with enhanced location strategy

#### Parameters

##### element

[`DOMElementNode`](../interfaces/DOMElementNode.md)

#### Returns

`Promise`\<`null` \| `ElementHandle`\>

#### Defined in

[src/browser/context.ts:1265](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1265)

***

### getPageHtml()

> **getPageHtml**(`options`): `Promise`\<`string`\>

Get the current page HTML content with error handling

#### Parameters

##### options

###### timeout

`number`

###### waitUntil

`"load"` \| `"domcontentloaded"` \| `"networkidle"`

#### Returns

`Promise`\<`string`\>

#### Defined in

[src/browser/context.ts:981](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L981)

***

### getSession()

> **getSession**(): `Promise`\<`BrowserSession`\>

Get the current session

#### Returns

`Promise`\<`BrowserSession`\>

#### Defined in

[src/browser/context.ts:217](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L217)

***

### getState()

> **getState**(`useVision`): `Promise`\<`BrowserState`\>

Get the current state of the browser

#### Parameters

##### useVision

`boolean` = `false`

Whether to include a screenshot in the state

#### Returns

`Promise`\<`BrowserState`\>

#### Defined in

[src/browser/context.ts:496](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L496)

***

### getStateHistory()

> **getStateHistory**(): `Promise`\<`BrowserStateHistory`\>

Get the browser state history

#### Returns

`Promise`\<`BrowserStateHistory`\>

#### Defined in

[src/browser/context.ts:778](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L778)

***

### goBack()

> **goBack**(): `Promise`\<`void`\>

Navigate back in history

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:856](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L856)

***

### goForward()

> **goForward**(): `Promise`\<`void`\>

Navigate forward in history

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:865](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L865)

***

### importCookies()

> **importCookies**(`cookiesJson`): `Promise`\<`void`\>

Import cookies from a JSON string

#### Parameters

##### cookiesJson

`string`

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:1579](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1579)

***

### isFileUploader()

> **isFileUploader**(`elementNode`, `maxDepth`, `currentDepth`): `Promise`\<`boolean`\>

Check if element or its children are file uploaders

#### Parameters

##### elementNode

[`DOMElementNode`](../interfaces/DOMElementNode.md)

The element to check

##### maxDepth

`number` = `3`

Maximum depth to check children

##### currentDepth

`number` = `0`

Current depth in recursion

#### Returns

`Promise`\<`boolean`\>

#### Defined in

[src/browser/context.ts:905](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L905)

***

### mockResponse()

> **mockResponse**(`urlPattern`, `response`): `Promise`\<`void`\>

Mock a response for requests matching a URL pattern

#### Parameters

##### urlPattern

`string` | `RegExp`

##### response

###### body

`string`

###### headers

`Record`\<`string`, `string`\>

###### status

`number`

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:1803](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1803)

***

### navigateTo()

> **navigateTo**(`url`): `Promise`\<`void`\>

Navigate to a URL

#### Parameters

##### url

`string`

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:838](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L838)

***

### onConsole()

> **onConsole**(`handler`): `Promise`\<`void`\>

Add a console message listener with error handling

#### Parameters

##### handler

(`msg`) => `void` \| `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:1967](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1967)

***

### onDialog()

> **onDialog**(`handler`): `Promise`\<`void`\>

Add a dialog listener with error handling

#### Parameters

##### handler

(`dialog`) => `void` \| `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:1977](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1977)

***

### onDownload()

> **onDownload**(`handler`): `Promise`\<`void`\>

Add a download listener with error handling

#### Parameters

##### handler

(`download`) => `void` \| `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:1987](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1987)

***

### onFileChooser()

> **onFileChooser**(`handler`): `Promise`\<`void`\>

Add a file chooser listener with error handling

#### Parameters

##### handler

(`fileChooser`) => `void` \| `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:1997](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1997)

***

### onPageError()

> **onPageError**(`handler`): `Promise`\<`void`\>

Add a page error listener with error handling

#### Parameters

##### handler

(`error`) => `void` \| `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:2007](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L2007)

***

### onPopup()

> **onPopup**(`handler`): `Promise`\<`void`\>

Add a popup listener with error handling

#### Parameters

##### handler

(`page`) => `void` \| `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:2017](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L2017)

***

### onWebSocket()

> **onWebSocket**(`handler`): `Promise`\<`void`\>

Add a WebSocket listener with error handling

#### Parameters

##### handler

(`websocket`) => `void` \| `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:2027](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L2027)

***

### onWorker()

> **onWorker**(`handler`): `Promise`\<`void`\>

Add a worker listener with error handling

#### Parameters

##### handler

(`worker`) => `void` \| `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:2037](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L2037)

***

### refreshPage()

> **refreshPage**(): `Promise`\<`void`\>

Refresh the current page

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:847](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L847)

***

### removeAllEventListeners()

> **removeAllEventListeners**(`eventType`): `Promise`\<`void`\>

Remove all event listeners for a specific event type

#### Parameters

##### eventType

[`PageEventType`](../type-aliases/PageEventType.md)

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:1919](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1919)

***

### removeEventListener()

> **removeEventListener**\<`T`\>(`eventType`, `handler`): `void`

Remove an event listener for a specific page event

#### Type Parameters

• **T** *extends* [`PageEventType`](../type-aliases/PageEventType.md)

#### Parameters

##### eventType

`T`

##### handler

[`PageEventHandler`](../type-aliases/PageEventHandler.md)\[`T`\]

#### Returns

`void`

#### Defined in

[src/browser/context.ts:1896](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1896)

***

### removeRequestInterceptor()

> **removeRequestInterceptor**(`urlPattern`): `void`

Remove a request interceptor

#### Parameters

##### urlPattern

`string` | `RegExp`

#### Returns

`void`

#### Defined in

[src/browser/context.ts:1674](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1674)

***

### removeResponseInterceptor()

> **removeResponseInterceptor**(`urlPattern`): `void`

Remove a response interceptor

#### Parameters

##### urlPattern

`string` | `RegExp`

#### Returns

`void`

#### Defined in

[src/browser/context.ts:1759](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1759)

***

### setCookies()

> **setCookies**(`cookies`): `Promise`\<`void`\>

Set cookies for the current context

#### Parameters

##### cookies

`Cookie`[]

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:1497](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1497)

***

### startRequestInterception()

> **startRequestInterception**(`options`): `Promise`\<`void`\>

Start intercepting network requests

#### Parameters

##### options

###### ignoreErrors

`boolean`

###### timeout

`number`

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:1602](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1602)

***

### startResponseInterception()

> **startResponseInterception**(`options`): `Promise`\<`void`\>

Start intercepting network responses

#### Parameters

##### options

###### ignoreErrors

`boolean`

###### timeout

`number`

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:1697](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1697)

***

### switchToTab()

> **switchToTab**(`index`): `Promise`\<`void`\>

Switch to a specific tab

#### Parameters

##### index

`number`

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/context.ts:874](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L874)

***

### takeElementScreenshot()

> **takeElementScreenshot**(`index`, `path`?): `Promise`\<`string`\>

Take a screenshot of a specific element by index

#### Parameters

##### index

`number`

Element index in the selector map

##### path?

`string`

Optional path to save the screenshot

#### Returns

`Promise`\<`string`\>

Path to the saved screenshot

#### Defined in

[src/browser/context.ts:1382](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1382)

***

### takeFullPageScreenshot()

> **takeFullPageScreenshot**(`path`?): `Promise`\<`string`\>

Take a full page screenshot

#### Parameters

##### path?

`string`

Optional path to save the screenshot

#### Returns

`Promise`\<`string`\>

Path to the saved screenshot

#### Defined in

[src/browser/context.ts:1395](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1395)

***

### takeScreenshot()

> **takeScreenshot**(`options`): `Promise`\<`string`\>

Take a screenshot of the current page or element

#### Parameters

##### options

Screenshot options

###### element

[`DOMElementNode`](../interfaces/DOMElementNode.md)

###### fullPage

`boolean`

###### path

`string`

#### Returns

`Promise`\<`string`\>

Path to the saved screenshot

#### Defined in

[src/browser/context.ts:1347](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L1347)
