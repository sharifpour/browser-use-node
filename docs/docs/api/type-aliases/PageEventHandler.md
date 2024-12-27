[**browser-use-node**](../README.md)

***

[browser-use-node](../globals.md) / PageEventHandler

# Type Alias: PageEventHandler

> **PageEventHandler**: `object`

## Type declaration

### console()

> **console**: (`msg`) => `Promise`\<`void`\> \| `void`

#### Parameters

##### msg

`ConsoleMessage`

#### Returns

`Promise`\<`void`\> \| `void`

### dialog()

> **dialog**: (`dialog`) => `Promise`\<`void`\> \| `void`

#### Parameters

##### dialog

`Dialog`

#### Returns

`Promise`\<`void`\> \| `void`

### download()

> **download**: (`download`) => `Promise`\<`void`\> \| `void`

#### Parameters

##### download

###### suggestedFilename

`string`

###### url

`string`

#### Returns

`Promise`\<`void`\> \| `void`

### filechooser()

> **filechooser**: (`fileChooser`) => `Promise`\<`void`\> \| `void`

#### Parameters

##### fileChooser

`FileChooser`

#### Returns

`Promise`\<`void`\> \| `void`

### frameattached()

> **frameattached**: (`frame`) => `Promise`\<`void`\> \| `void`

#### Parameters

##### frame

`Frame`

#### Returns

`Promise`\<`void`\> \| `void`

### framedetached()

> **framedetached**: (`frame`) => `Promise`\<`void`\> \| `void`

#### Parameters

##### frame

`Frame`

#### Returns

`Promise`\<`void`\> \| `void`

### framenavigated()

> **framenavigated**: (`frame`) => `Promise`\<`void`\> \| `void`

#### Parameters

##### frame

`Frame`

#### Returns

`Promise`\<`void`\> \| `void`

### load()

> **load**: () => `Promise`\<`void`\> \| `void`

#### Returns

`Promise`\<`void`\> \| `void`

### pageerror()

> **pageerror**: (`error`) => `Promise`\<`void`\> \| `void`

#### Parameters

##### error

`Error`

#### Returns

`Promise`\<`void`\> \| `void`

### popup()

> **popup**: (`page`) => `Promise`\<`void`\> \| `void`

#### Parameters

##### page

`Page`

#### Returns

`Promise`\<`void`\> \| `void`

### request()

> **request**: (`request`) => `Promise`\<`void`\> \| `void`

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<`void`\> \| `void`

### requestfailed()

> **requestfailed**: (`request`) => `Promise`\<`void`\> \| `void`

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<`void`\> \| `void`

### requestfinished()

> **requestfinished**: (`request`) => `Promise`\<`void`\> \| `void`

#### Parameters

##### request

`Request`

#### Returns

`Promise`\<`void`\> \| `void`

### response()

> **response**: (`response`) => `Promise`\<`void`\> \| `void`

#### Parameters

##### response

`Response`

#### Returns

`Promise`\<`void`\> \| `void`

### websocket()

> **websocket**: (`websocket`) => `Promise`\<`void`\> \| `void`

#### Parameters

##### websocket

`WebSocket`

#### Returns

`Promise`\<`void`\> \| `void`

### worker()

> **worker**: (`worker`) => `Promise`\<`void`\> \| `void`

#### Parameters

##### worker

`Worker`

#### Returns

`Promise`\<`void`\> \| `void`

## Defined in

[src/browser/context.ts:59](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/browser/context.ts#L59)
