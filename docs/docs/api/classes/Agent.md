[**browser-use-node**](../README.md)

***

[browser-use-node](../globals.md) / Agent

# Class: Agent

## Constructors

### new Agent()

> **new Agent**(`config`): [`Agent`](Agent.md)

#### Parameters

##### config

[`AgentConfig`](../interfaces/AgentConfig.md)

#### Returns

[`Agent`](Agent.md)

#### Defined in

[src/agent/agent.ts:29](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/agent/agent.ts#L29)

## Methods

### getNextAction()

> **getNextAction**(`state`, `result`): `Promise`\<[`AgentAction`](../interfaces/AgentAction.md)[]\>

#### Parameters

##### state

`BrowserState`

##### result

`null` | `ActionResult`[]

#### Returns

`Promise`\<[`AgentAction`](../interfaces/AgentAction.md)[]\>

#### Defined in

[src/agent/agent.ts:45](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/agent/agent.ts#L45)

***

### reduceTokenLimit()

> **reduceTokenLimit**(`reduction`): `void`

#### Parameters

##### reduction

`number`

#### Returns

`void`

#### Defined in

[src/agent/agent.ts:131](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/agent/agent.ts#L131)

***

### removeLastStateMessage()

> **removeLastStateMessage**(): `void`

#### Returns

`void`

#### Defined in

[src/agent/agent.ts:127](https://github.com/Dankovk/browser-use-js/blob/7aa31eb34b7bafb64e3abcce35e6168864b0fa74/src/agent/agent.ts#L127)
