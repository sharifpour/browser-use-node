/**
 * Browser action controller
 */

import type { BrowserContext } from '../browser';
import { Registry } from './registry/service';
import type { ActionModel, ActionResult } from './types';

export class Controller {
	private readonly registry: Registry;

	constructor() {
		this.registry = new Registry();
	}

	public async execute_action(action: ActionModel, context: BrowserContext): Promise<ActionResult[]> {
		try {
			const handler = this.registry.get_action(action.action);
			if (!handler) {
				return [{
					error: `Unknown action: ${action.action}`,
					is_done: false
				}];
			}

			return await handler(action.args, context);
		} catch (error) {
			return [{
				error: error instanceof Error ? error.message : String(error),
				is_done: false
			}];
		}
	}
}
