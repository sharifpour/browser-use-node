[**browser-use-node**](../README.md)

***

[browser-use-node](../globals.md) / Controller

# Class: Controller

Controller for browser automation actions

## Constructors

### new Controller()

> **new Controller**(): [`Controller`](Controller.md)

#### Returns

[`Controller`](Controller.md)

#### Defined in

[src/controller/controller.ts:50](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/controller/controller.ts#L50)

## Methods

### act()

> **act**(`action`, `browserContext`): `Promise`\<`ActionResult`\>

Execute a single action

#### Parameters

##### action

`ActionModel`

##### browserContext

[`BrowserContext`](BrowserContext.md)

#### Returns

`Promise`\<`ActionResult`\>

#### Defined in

[src/controller/controller.ts:498](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/controller/controller.ts#L498)

***

### action()

> **action**(`description`, `func`, `options`): `ActionFunction`

Register a custom action

#### Parameters

##### description

`string`

##### func

`ActionFunction`

##### options

###### paramModel

`ZodType`\<`unknown`, `unknown`\>

###### requiresBrowser

`boolean`

#### Returns

`ActionFunction`

#### Defined in

[src/controller/controller.ts:428](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/controller/controller.ts#L428)

***

### multiAct()

> **multiAct**(`actions`, `browserContext`): `Promise`\<`ActionResult`[]\>

Execute multiple actions

#### Parameters

##### actions

`ActionModel`[]

##### browserContext

[`BrowserContext`](BrowserContext.md)

#### Returns

`Promise`\<`ActionResult`[]\>

#### Defined in

[src/controller/controller.ts:435](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/controller/controller.ts#L435)
