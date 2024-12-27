[**browser-use-node**](../README.md)

***

[browser-use-node](../globals.md) / Registry

# Class: Registry

Action registry for browser automation

## Constructors

### new Registry()

> **new Registry**(): [`Registry`](Registry.md)

#### Returns

[`Registry`](Registry.md)

#### Defined in

[src/controller/registry.ts:36](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/controller/registry.ts#L36)

## Methods

### action()

> **action**(`description`, `func`, `options`): `ActionFunction`

Register an action

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

[src/controller/registry.ts:72](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/controller/registry.ts#L72)

***

### createActionModel()

> **createActionModel**(): `ZodType`\<`unknown`, `unknown`\>

Create dynamic action model

#### Returns

`ZodType`\<`unknown`, `unknown`\>

#### Defined in

[src/controller/registry.ts:177](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/controller/registry.ts#L177)

***

### executeAction()

> **executeAction**(`name`, `params`, `browser`?): `Promise`\<`ActionResult`\>

Execute a registered action

#### Parameters

##### name

`string`

##### params

`Record`\<`string`, `unknown`\>

##### browser?

[`BrowserContext`](BrowserContext.md)

#### Returns

`Promise`\<`ActionResult`\>

#### Defined in

[src/controller/registry.ts:134](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/controller/registry.ts#L134)

***

### getAction()

> **getAction**(`name`): `undefined` \| `ActionRegistration`

Get a registered action

#### Parameters

##### name

`string`

#### Returns

`undefined` \| `ActionRegistration`

#### Defined in

[src/controller/registry.ts:127](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/controller/registry.ts#L127)

***

### getPromptDescription()

> **getPromptDescription**(): `string`

Get prompt description for all registered actions

#### Returns

`string`

#### Defined in

[src/controller/registry.ts:159](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/controller/registry.ts#L159)

***

### getRegisteredActions()

> **getRegisteredActions**(): `ActionRegistration`[]

Get all registered actions

#### Returns

`ActionRegistration`[]

#### Defined in

[src/controller/registry.ts:170](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/controller/registry.ts#L170)
