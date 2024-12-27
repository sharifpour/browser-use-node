[**browser-use-node**](../README.md)

***

[browser-use-node](../globals.md) / ConfigManager

# Class: ConfigManager

Configuration manager

## Methods

### getBrowserConfig()

> **getBrowserConfig**(): `object`

Get browser configuration

#### Returns

`object`

##### chromeInstancePath?

> `optional` **chromeInstancePath**: `string`

Path to Chrome instance for connecting to normal browser

##### disableSecurity

> **disableSecurity**: `boolean`

Whether to disable browser security features

##### extraChromiumArgs

> **extraChromiumArgs**: `string`[]

Additional Chromium arguments

##### headless

> **headless**: `boolean`

Whether to run the browser in headless mode

##### newContextConfig?

> `optional` **newContextConfig**: `object`

Default configuration for new browser contexts

###### newContextConfig.browserWindowSize

> **browserWindowSize**: `object`

Browser window size

###### newContextConfig.browserWindowSize.height

> **height**: `number`

###### newContextConfig.browserWindowSize.width

> **width**: `number`

###### newContextConfig.cookiesFile?

> `optional` **cookiesFile**: `string`

Path to cookies file for persistence

###### newContextConfig.maximumWaitPageLoadTime

> **maximumWaitPageLoadTime**: `number`

Maximum time to wait for page load in seconds

###### newContextConfig.minimumWaitPageLoadTime

> **minimumWaitPageLoadTime**: `number`

Minimum time to wait for page load in seconds

###### newContextConfig.noViewport

> **noViewport**: `boolean`

Whether to disable viewport

###### newContextConfig.saveRecordingPath?

> `optional` **saveRecordingPath**: `string`

Path to save video recordings

###### newContextConfig.saveScreenshots

> **saveScreenshots**: `boolean`

Whether to save screenshots

###### newContextConfig.tracePath?

> `optional` **tracePath**: `string`

Path to save trace files

###### newContextConfig.waitBetweenActions

> **waitBetweenActions**: `number`

Time to wait between actions in seconds

###### newContextConfig.waitForNetworkIdlePageLoadTime

> **waitForNetworkIdlePageLoadTime**: `number`

Time to wait for network idle in seconds

##### proxy?

> `optional` **proxy**: `object`

Proxy settings

###### proxy.bypass?

> `optional` **bypass**: `string`

###### proxy.password?

> `optional` **password**: `string`

###### proxy.server

> **server**: `string`

###### proxy.username?

> `optional` **username**: `string`

##### wssUrl?

> `optional` **wssUrl**: `string`

WebSocket URL for connecting to browser

#### Defined in

[src/config/manager.ts:194](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/config/manager.ts#L194)

***

### getContextConfig()

> **getContextConfig**(): `Partial`\<`BrowserContextConfig`\>

Get context configuration

#### Returns

`Partial`\<`BrowserContextConfig`\>

#### Defined in

[src/config/manager.ts:201](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/config/manager.ts#L201)

***

### getLoggingConfig()

> **getLoggingConfig**(): `undefined` \| \{ `console`: `boolean`; `file`: `string`; `level`: `"debug"` \| `"info"` \| `"warn"` \| `"error"`; \}

Get logging configuration

#### Returns

`undefined` \| \{ `console`: `boolean`; `file`: `string`; `level`: `"debug"` \| `"info"` \| `"warn"` \| `"error"`; \}

#### Defined in

[src/config/manager.ts:208](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/config/manager.ts#L208)

***

### resetConfig()

> **resetConfig**(): `void`

Reset configuration to defaults

#### Returns

`void`

#### Defined in

[src/config/manager.ts:245](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/config/manager.ts#L245)

***

### saveConfig()

> **saveConfig**(`filePath`?): `void`

Save configuration to file

#### Parameters

##### filePath?

`string`

#### Returns

`void`

#### Defined in

[src/config/manager.ts:215](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/config/manager.ts#L215)

***

### updateConfig()

> **updateConfig**(`newConfig`): `void`

Update configuration

#### Parameters

##### newConfig

`Partial`\<\{ `browser`: \{ `chromeInstancePath`: `string`; `disableSecurity`: `boolean`; `extraChromiumArgs`: `string`[]; `headless`: `boolean`; `newContextConfig`: \{ `browserWindowSize`: \{ `height`: `number`; `width`: `number`; \}; `cookiesFile`: `string`; `maximumWaitPageLoadTime`: `number`; `minimumWaitPageLoadTime`: `number`; `noViewport`: `boolean`; `saveRecordingPath`: `string`; `saveScreenshots`: `boolean`; `tracePath`: `string`; `waitBetweenActions`: `number`; `waitForNetworkIdlePageLoadTime`: `number`; \}; `proxy`: \{ `bypass`: `string`; `password`: `string`; `server`: `string`; `username`: `string`; \}; `wssUrl`: `string`; \}; `context`: \{ `browserWindowSize`: \{ `height`: `number`; `width`: `number`; \}; `disableSecurity`: `boolean`; `maximumWaitPageLoadTime`: `number`; `minimumWaitPageLoadTime`: `number`; `noViewport`: `boolean`; `saveRecordingPath`: `string`; `saveScreenshots`: `boolean`; `tracePath`: `string`; `waitBetweenActions`: `number`; `waitForNetworkIdlePageLoadTime`: `number`; \}; `logging`: \{ `console`: `boolean`; `file`: `string`; `level`: `"debug"` \| `"info"` \| `"warn"` \| `"error"`; \}; \}\>

#### Returns

`void`

#### Defined in

[src/config/manager.ts:232](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/config/manager.ts#L232)

***

### getInstance()

> `static` **getInstance**(): [`ConfigManager`](ConfigManager.md)

Get singleton instance

#### Returns

[`ConfigManager`](ConfigManager.md)

#### Defined in

[src/config/manager.ts:69](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/config/manager.ts#L69)
