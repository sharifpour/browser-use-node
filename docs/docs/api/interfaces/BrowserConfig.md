[**browser-use-node**](../README.md)

***

[browser-use-node](../globals.md) / BrowserConfig

# Interface: BrowserConfig

Configuration for the Browser.

## Properties

### chromeInstancePath?

> `optional` **chromeInstancePath**: `string`

Path to a Chrome instance to use to connect to your normal browser
e.g. '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

#### Defined in

[src/browser/browser.ts:45](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/browser.ts#L45)

***

### disableSecurity?

> `optional` **disableSecurity**: `boolean`

Disable browser security features

#### Default

```ts
true
```

#### Defined in

[src/browser/browser.ts:33](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/browser.ts#L33)

***

### extraChromiumArgs?

> `optional` **extraChromiumArgs**: `string`[]

Extra arguments to pass to the browser

#### Default

```ts
[]
```

#### Defined in

[src/browser/browser.ts:39](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/browser.ts#L39)

***

### headless?

> `optional` **headless**: `boolean`

Whether to run browser in headless mode

#### Default

```ts
false
```

#### Defined in

[src/browser/browser.ts:27](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/browser.ts#L27)

***

### newContextConfig?

> `optional` **newContextConfig**: `BrowserContextConfig`

Default configuration for new browser contexts

#### Defined in

[src/browser/browser.ts:60](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/browser.ts#L60)

***

### proxy?

> `optional` **proxy**: [`ProxySettings`](ProxySettings.md)

Proxy settings

#### Defined in

[src/browser/browser.ts:55](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/browser.ts#L55)

***

### trace?

> `optional` **trace**: `boolean`

Whether to trace browser actions

#### Defined in

[src/browser/browser.ts:65](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/browser.ts#L65)

***

### tracePath?

> `optional` **tracePath**: `string`

Path to save browser traces

#### Defined in

[src/browser/browser.ts:70](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/browser.ts#L70)

***

### wssUrl?

> `optional` **wssUrl**: `string`

Connect to a browser instance via WebSocket

#### Defined in

[src/browser/browser.ts:50](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/browser.ts#L50)
