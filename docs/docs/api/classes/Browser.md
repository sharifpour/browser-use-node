[**browser-use-node**](../README.md)

***

[browser-use-node](../globals.md) / Browser

# Class: Browser

Playwright browser on steroids.

This is a persistent browser factory that can spawn multiple browser contexts.
It is recommended to use only one instance of Browser per your application (RAM usage will grow otherwise).

## Constructors

### new Browser()

> **new Browser**(`config`): [`Browser`](Browser.md)

#### Parameters

##### config

[`BrowserConfig`](../interfaces/BrowserConfig.md) = `{}`

#### Returns

[`Browser`](Browser.md)

#### Defined in

[src/browser/browser.ts:89](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/browser.ts#L89)

## Methods

### cleanup()

> **cleanup**(): `Promise`\<`void`\>

Cleanup when object is destroyed

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/browser.ts:254](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/browser.ts#L254)

***

### close()

> **close**(): `Promise`\<`void`\>

Close the browser instance

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/browser/browser.ts:239](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/browser.ts#L239)

***

### getConfig()

> **getConfig**(): `Promise`\<[`BrowserConfig`](../interfaces/BrowserConfig.md)\>

Get the current configuration

#### Returns

`Promise`\<[`BrowserConfig`](../interfaces/BrowserConfig.md)\>

#### Defined in

[src/browser/browser.ts:113](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/browser.ts#L113)

***

### getPlaywrightBrowser()

> **getPlaywrightBrowser**(): `Promise`\<`Browser`\>

Get a browser context

#### Returns

`Promise`\<`Browser`\>

#### Defined in

[src/browser/browser.ts:103](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/browser.ts#L103)

***

### newContext()

> **newContext**(`config`): `Promise`\<[`BrowserContext`](BrowserContext.md)\>

Create a browser context

#### Parameters

##### config

`BrowserContextConfig` = `{}`

#### Returns

`Promise`\<[`BrowserContext`](BrowserContext.md)\>

#### Defined in

[src/browser/browser.ts:96](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/browser.ts#L96)
