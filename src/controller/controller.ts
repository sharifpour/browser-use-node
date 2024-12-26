/**
 * Browser action controller
 */

import type { BrowserContext } from '../browser/context';
import { Registry } from './registry';
import type { ActionModel, ActionResult } from './types';
import { z } from 'zod';
import type {
	SearchGoogleAction,
	GoToUrlAction,
	ClickElementAction,
	InputTextAction,
	OpenTabAction,
	SwitchTabAction,
	ScrollAction,
	SendKeysAction,
	DoneAction,
	ScrollToTextAction,
	GetDropdownOptionsAction,
	SelectDropdownOptionAction
} from './actions';
import {
	SearchGoogleActionSchema,
	GoToUrlActionSchema,
	ClickElementActionSchema,
	InputTextActionSchema,
	OpenTabActionSchema,
	SwitchTabActionSchema,
	ExtractPageContentActionSchema,
	ScrollActionSchema,
	SendKeysActionSchema,
	DoneActionSchema,
	ScrollToTextActionSchema,
	GetDropdownOptionsActionSchema,
	SelectDropdownOptionActionSchema
} from './actions';
import { ProductTelemetry } from '../telemetry/service';
import { ActionError, ValidationError, NetworkError, TimeoutError, createError, formatError } from '../errors';

export type ActionFunction = (params: Record<string, unknown>, browser?: BrowserContext) => Promise<ActionResult>;

/**
 * Controller for browser automation actions
 */
export class Controller {
	private readonly registry: Registry;
	private readonly telemetry: ProductTelemetry;

	constructor() {
		this.registry = new Registry();
		this.telemetry = new ProductTelemetry();
		this.registerDefaultActions();
	}

	/**
	 * Register default browser actions
	 */
	private registerDefaultActions(): void {
		// Basic Navigation Actions
		this.registry.action(
			'Search Google in the current tab',
			{ paramModel: SearchGoogleActionSchema, requiresBrowser: true }
		)(async (params: Record<string, unknown>, browser: BrowserContext): Promise<ActionResult> => {
			const validatedParams = SearchGoogleActionSchema.parse(params) as SearchGoogleAction;
			const page = await browser.getPage();
			await page.goto(`https://www.google.com/search?q=${validatedParams.query}`);
			await page.waitForLoadState();
			await browser.waitForStableNetwork();
			const msg = `🔍  Searched for "${validatedParams.query}" in Google`;
			console.log(msg);
			return { extracted_content: msg, include_in_memory: true };
		});

		this.registry.action(
			'Navigate to URL in the current tab',
			{ paramModel: GoToUrlActionSchema, requiresBrowser: true }
		)(async (params: Record<string, unknown>, browser: BrowserContext): Promise<ActionResult> => {
			const validatedParams = GoToUrlActionSchema.parse(params) as GoToUrlAction;
			const page = await browser.getPage();
			await page.goto(validatedParams.url);
			await page.waitForLoadState();
			const msg = `🔗  Navigated to ${validatedParams.url}`;
			console.log(msg);
			return { extracted_content: msg, include_in_memory: true };
		});

		this.registry.action(
			'Go back',
			{ paramModel: z.object({}).strict(), requiresBrowser: true }
		)(async (_: Record<string, unknown>, browser: BrowserContext): Promise<ActionResult> => {
			const page = await browser.getPage();
			await page.goBack();
			await page.waitForLoadState();
			const msg = '🔙  Navigated back';
			console.log(msg);
			return { extracted_content: msg, include_in_memory: true };
		});

		// Element Interaction Actions
		this.registry.action(
			'Click element',
			{ paramModel: ClickElementActionSchema, requiresBrowser: true }
		)(async (params: Record<string, unknown>, browser: BrowserContext): Promise<ActionResult> => {
			const validatedParams = ClickElementActionSchema.parse(params) as ClickElementAction;
			const session = await browser.getSession();
			const state = session.cachedState;

			if (!(validatedParams.index in state.selectorMap)) {
				throw new ActionError(
					`Element with index ${validatedParams.index} does not exist - retry or use alternative actions`,
					'validation'
				);
			}

			const elementNode = state.selectorMap[validatedParams.index];
			const initialPages = browser.pages.length;

			if (await browser.isFileUploader(elementNode)) {
				const msg = `Index ${validatedParams.index} - has an element which opens file upload dialog. To upload files please use a specific function to upload files`;
				console.log(msg);
				return { extracted_content: msg, include_in_memory: true };
			}

			try {
				await browser.clickElementNode(elementNode);
				let msg = `🖱️  Clicked index ${validatedParams.index}`;
				console.log(msg);
				console.debug(`Element xpath: ${elementNode.xpath}`);

				if (browser.pages.length > initialPages) {
					const newTabMsg = 'New tab opened - switching to it';
					msg += ` - ${newTabMsg}`;
					console.log(newTabMsg);
					await browser.switchToTab(-1);
				}

				return { extracted_content: msg, include_in_memory: true };
			} catch (error) {
				console.warn(`Element no longer available with index ${validatedParams.index} - most likely the page changed`);
				return { error: String(error), include_in_memory: true };
			}
		});

		this.registry.action(
			'Input text into a input interactive element',
			{ paramModel: InputTextActionSchema, requiresBrowser: true }
		)(async (params: Record<string, unknown>, browser: BrowserContext): Promise<ActionResult> => {
			const validatedParams = InputTextActionSchema.parse(params) as InputTextAction;
			const session = await browser.getSession();
			const state = session.cachedState;

			if (!(validatedParams.index in state.selectorMap)) {
				throw new Error(`Element index ${validatedParams.index} does not exist - retry or use alternative actions`);
			}

			const elementNode = state.selectorMap[validatedParams.index];
			await browser.inputTextElementNode(elementNode, validatedParams.text);
			const msg = `⌨️  Input "${validatedParams.text}" into index ${validatedParams.index}`;
			console.log(msg);
			console.debug(`Element xpath: ${elementNode.xpath}`);
			return { extracted_content: msg, include_in_memory: true };
		});

		// Tab Management Actions
		this.registry.action(
			'Switch tab',
			{ paramModel: SwitchTabActionSchema, requiresBrowser: true }
		)(async (params: Record<string, unknown>, browser: BrowserContext): Promise<ActionResult> => {
			const validatedParams = SwitchTabActionSchema.parse(params) as SwitchTabAction;
			await browser.switchToTab(validatedParams.pageId);
			const page = await browser.getPage();
			await page.waitForLoadState();
			const msg = `🔄  Switched to tab ${validatedParams.pageId}`;
			console.log(msg);
			return { extracted_content: msg, include_in_memory: true };
		});

		this.registry.action(
			'Open url in new tab',
			{ paramModel: OpenTabActionSchema, requiresBrowser: true }
		)(async (params: Record<string, unknown>, browser: BrowserContext): Promise<ActionResult> => {
			const validatedParams = OpenTabActionSchema.parse(params) as OpenTabAction;
			await browser.createNewTab(validatedParams.url);
			const msg = `🔗  Opened new tab with ${validatedParams.url}`;
			console.log(msg);
			return { extracted_content: msg, include_in_memory: true };
		});

		// Content Actions
		this.registry.action(
			'Extract page content to get the text or markdown',
			{ paramModel: ExtractPageContentActionSchema, requiresBrowser: true }
		)(async (_: Record<string, unknown>, browser: BrowserContext): Promise<ActionResult> => {
			const page = await browser.getPage();
			const content = await page.evaluate(() => document.body.innerText);
			const msg = `📄  Extracted page content\n: ${content}\n`;
			console.log(msg);
			return { extracted_content: msg, include_in_memory: false };
		});

		this.registry.action(
			'Complete task',
			{ paramModel: DoneActionSchema, requiresBrowser: false }
		)(async (params: Record<string, unknown>): Promise<ActionResult> => {
			const validatedParams = DoneActionSchema.parse(params) as DoneAction;
			return { is_done: true, extracted_content: validatedParams.text, include_in_memory: true };
		});

		this.registry.action(
			'Scroll down the page by pixel amount - if no amount is specified, scroll down one page',
			{ paramModel: ScrollActionSchema, requiresBrowser: true }
		)(async (params: Record<string, unknown>, browser: BrowserContext): Promise<ActionResult> => {
			const validatedParams = ScrollActionSchema.parse(params) as ScrollAction;
			const page = await browser.getPage();
			if (validatedParams.amount !== undefined) {
				await page.evaluate(`window.scrollBy(0, ${validatedParams.amount});`);
			} else {
				await page.keyboard.press('PageDown');
			}

			const amount = validatedParams.amount !== undefined ? `${validatedParams.amount} pixels` : 'one page';
			const msg = `🔍  Scrolled down the page by ${amount}`;
			console.log(msg);
			return { extracted_content: msg, include_in_memory: true };
		});

		this.registry.action(
			'Scroll up the page by pixel amount - if no amount is specified, scroll up one page',
			{ paramModel: ScrollActionSchema, requiresBrowser: true }
		)(async (params: Record<string, unknown>, browser: BrowserContext): Promise<ActionResult> => {
			const validatedParams = ScrollActionSchema.parse(params) as ScrollAction;
			const page = await browser.getPage();
			if (validatedParams.amount !== undefined) {
				await page.evaluate(`window.scrollBy(0, -${validatedParams.amount});`);
			} else {
				await page.keyboard.press('PageUp');
			}

			const amount = validatedParams.amount !== undefined ? `${validatedParams.amount} pixels` : 'one page';
			const msg = `🔍  Scrolled up the page by ${amount}`;
			console.log(msg);
			return { extracted_content: msg, include_in_memory: true };
		});

		this.registry.action(
			'Send strings of special keys like Backspace, Insert, PageDown, Delete, Enter, Shortcuts such as `Control+o`, `Control+Shift+T` are supported as well.',
			{ paramModel: SendKeysActionSchema, requiresBrowser: true }
		)(async (params: Record<string, unknown>, browser: BrowserContext): Promise<ActionResult> => {
			const validatedParams = SendKeysActionSchema.parse(params) as SendKeysAction;
			const page = await browser.getPage();
			await page.keyboard.press(validatedParams.keys);
			const msg = `⌨️  Sent keys: ${validatedParams.keys}`;
			console.log(msg);
			return { extracted_content: msg, include_in_memory: true };
		});

		this.registry.action(
			'If you dont find something which you want to interact with, scroll to it',
			{ paramModel: ScrollToTextActionSchema, requiresBrowser: true }
		)(async (params: Record<string, unknown>, browser: BrowserContext): Promise<ActionResult> => {
			const validatedParams = ScrollToTextActionSchema.parse(params) as ScrollToTextAction;
			const page = await browser.getPage();
			try {
				// Try different locator strategies
				const locators = [
					page.getByText(validatedParams.text, { exact: false }),
					page.locator(`text=${validatedParams.text}`),
					page.locator(`//*[contains(text(), '${validatedParams.text}')]`)
				];

				for (const locator of locators) {
					try {
						if (await locator.count() > 0 && await locator.first().isVisible()) {
							await locator.first().scrollIntoViewIfNeeded();
							await new Promise(resolve => setTimeout(resolve, 500)); // Wait for scroll to complete
							const msg = `🔍  Scrolled to text: ${validatedParams.text}`;
							console.log(msg);
							return { extracted_content: msg, include_in_memory: true };
						}
					} catch {
						// Try next locator
					}
				}
				return { error: `Could not find text: ${validatedParams.text}`, include_in_memory: true };
			} catch (error) {
				return { error: String(error), include_in_memory: true };
			}
		});

		this.registry.action(
			'Get all options from a native dropdown',
			{ paramModel: GetDropdownOptionsActionSchema, requiresBrowser: true }
		)(async (params: Record<string, unknown>, browser: BrowserContext): Promise<ActionResult> => {
			const validatedParams = GetDropdownOptionsActionSchema.parse(params) as GetDropdownOptionsAction;
			const session = await browser.getSession();
			const state = session.cachedState;

			if (!(validatedParams.index in state.selectorMap)) {
				throw new Error(`Element index ${validatedParams.index} does not exist - retry or use alternative actions`);
			}

			const elementNode = state.selectorMap[validatedParams.index];
			const page = await browser.getPage();

			try {
				const options = await page.evaluate((xpath) => {
					const element = document.evaluate(
						xpath,
						document,
						null,
						XPathResult.FIRST_ORDERED_NODE_TYPE,
						null
					).singleNodeValue as HTMLSelectElement;

					if (!element || element.tagName.toLowerCase() !== 'select') {
						throw new Error('Element is not a select dropdown');
					}

					return Array.from(element.options).map(option => ({
						text: option.text,
						value: option.value,
						selected: option.selected
					}));
				}, elementNode.xpath);

				const msg = `📝 Available options for dropdown ${validatedParams.index}:\n${options.map(opt => `- ${opt.text} (${opt.value})${opt.selected ? ' [selected]' : ''}`).join('\n')
					}`;
				console.log(msg);
				return { extracted_content: msg, include_in_memory: true };
			} catch (error) {
				return { error: String(error), include_in_memory: true };
			}
		});

		this.registry.action(
			'Select dropdown option for interactive element index by the text of the option you want to select',
			{ paramModel: SelectDropdownOptionActionSchema, requiresBrowser: true }
		)(async (params: Record<string, unknown>, browser: BrowserContext): Promise<ActionResult> => {
			const validatedParams = SelectDropdownOptionActionSchema.parse(params) as SelectDropdownOptionAction;
			const session = await browser.getSession();
			const state = session.cachedState;

			if (!(validatedParams.index in state.selectorMap)) {
				throw new Error(`Element index ${validatedParams.index} does not exist - retry or use alternative actions`);
			}

			const elementNode = state.selectorMap[validatedParams.index];
			const page = await browser.getPage();

			try {
				await page.evaluate(
					({ xpath, text }) => {
						const element = document.evaluate(
							xpath,
							document,
							null,
							XPathResult.FIRST_ORDERED_NODE_TYPE,
							null
						).singleNodeValue as HTMLSelectElement;

						if (!element || element.tagName.toLowerCase() !== 'select') {
							throw new Error('Element is not a select dropdown');
						}

						const option = Array.from(element.options).find(opt =>
							opt.text.toLowerCase() === text.toLowerCase() ||
							opt.value.toLowerCase() === text.toLowerCase()
						);

						if (!option) {
							throw new Error(`Option with text "${text}" not found`);
						}

						element.value = option.value;
						element.dispatchEvent(new Event('change', { bubbles: true }));
					},
					{ xpath: elementNode.xpath, text: validatedParams.text }
						return Array.from(element.options).map(option => ({
							text: option.text,
							value: option.value,
							selected: option.selected
						}));
					}, elementNode.xpath);

					const msg = `📝 Available options for dropdown ${validatedParams.index}:\n${
						options.map(opt => `- ${opt.text} (${opt.value})${opt.selected ? ' [selected]' : ''}`).join('\n')
					}`;
					console.log(msg);
					return { extracted_content: msg, include_in_memory: true };
				} catch (error) {
					return { error: String(error), include_in_memory: true };
				}
			},
			{ paramModel: GetDropdownOptionsActionSchema, requiresBrowser: true }
		);

		this.registry.action(
			'Select dropdown option for interactive element index by the text of the option you want to select',
			async (params: Record<string, unknown>, browser: BrowserContext): Promise<ActionResult> => {
				const validatedParams = SelectDropdownOptionActionSchema.parse(params) as SelectDropdownOptionAction;
				const session = await browser.getSession();
				const state = session.cachedState;

				if (!(validatedParams.index in state.selectorMap)) {
					throw new Error(`Element index ${validatedParams.index} does not exist - retry or use alternative actions`);
				}

				const elementNode = state.selectorMap[validatedParams.index];
				const page = await browser.getPage();

				try {
					await page.evaluate(
						({ xpath, text }) => {
							const element = document.evaluate(
								xpath,
								document,
								null,
								XPathResult.FIRST_ORDERED_NODE_TYPE,
								null
							).singleNodeValue as HTMLSelectElement;

							if (!element || element.tagName.toLowerCase() !== 'select') {
								throw new Error('Element is not a select dropdown');
							}

							const option = Array.from(element.options).find(opt =>
								opt.text.toLowerCase() === text.toLowerCase() ||
								opt.value.toLowerCase() === text.toLowerCase()
							);

							if (!option) {
								throw new Error(`Option with text "${text}" not found`);
							}

							element.value = option.value;
							element.dispatchEvent(new Event('change', { bubbles: true }));
						},
						{ xpath: elementNode.xpath, text: validatedParams.text }
					);

					const msg = `📝 Selected option "${validatedParams.text}" in dropdown ${validatedParams.index}`;
					console.log(msg);
					return { extracted_content: msg, include_in_memory: true };
				} catch (error) {
					return { error: String(error), include_in_memory: true };
				}
			},
			{ paramModel: SelectDropdownOptionActionSchema, requiresBrowser: true }
		);
	}

	/**
	 * Register a custom action
	 */
	public action(description: string, func: ActionFunction, options: { paramModel?: z.ZodType<unknown>; requiresBrowser?: boolean } = {}) {
		return this.registry.action(description, func, options);
	}

	/**
	 * Execute multiple actions
	 */
	public async multiAct(actions: ActionModel[], browserContext: BrowserContext): Promise<ActionResult[]> {
		const results: ActionResult[] = [];
		const session = await browserContext.getSession();
		const cachedSelectorMap = session.cachedState.selectorMap;
		const cachedPathHashes = new Set(Object.values(cachedSelectorMap).map(e => e.hash?.branchPathHash));
		await browserContext.removeHighlights();

		for (let i = 0; i < actions.length; i++) {
			const action = actions[i];

			// Validate action before execution
			try {
				await this.validateAction(action, browserContext);
			} catch (error) {
				const formattedError = formatError(error, true);
				console.error(`Action validation failed: ${formattedError}`);
				results.push({ error: formattedError, include_in_memory: true });
				break;
			}

			// Check for new elements if action uses element index
			if (action.getIndex() !== undefined && i !== 0) {
				const newState = await browserContext.getState();
				const newPathHashes = new Set(Object.values(newState.selectorMap).map(e => e.hash?.branchPathHash));
				if (!Array.from(newPathHashes).every(hash => hash && cachedPathHashes.has(hash))) {
					const msg = `Something new appeared after action ${i} / ${actions.length}`;
					console.log(msg);
					break;
				}
			}

			// Execute action with error handling
			try {
				const result = await this.act(action, browserContext);
				results.push(result);
				console.debug(`Executed action ${i + 1} / ${actions.length}`);

				// Wait for network stability after action
				try {
					await browserContext.waitForStableNetwork();
				} catch (error) {
					throw new NetworkError('Failed to wait for network stability', error);
				}

				if (result.is_done || result.error || i === actions.length - 1) {
					break;
				}

				await new Promise(resolve => setTimeout(resolve, browserContext.getConfig().waitBetweenActions * 1000));
			} catch (error) {
				const formattedError = formatError(error, true);
				console.error(`Action execution failed: ${formattedError}`);
				results.push({ error: formattedError, include_in_memory: true });
				break;
			}
		}

		return results;
	}

	/**
	 * Execute a single action
	 */
	public async act(action: ActionModel, browserContext: BrowserContext): Promise<ActionResult> {
		try {
			const actionData = action.toJSON();
			for (const [actionName, params] of Object.entries(actionData)) {
				if (params !== undefined) {
					// Validate action parameters
					await this.validateActionParams(actionName, params as Record<string, unknown>);

					// Execute action with browser context if required
					const result = await this.registry.executeAction(actionName, params as Record<string, unknown>, browserContext);

					// Validate and normalize result
					if (typeof result === 'string') {
						return { extracted_content: result, include_in_memory: true };
					} else if (this.isValidActionResult(result)) {
						return result;
					} else if (result === undefined || result === null) {
						return { include_in_memory: false };
					} else {
						throw createError(
							`Invalid action result type: ${typeof result} of ${result}`,
							ActionError,
							{
								code: 'INVALID_ACTION_RESULT',
								details: { result }
							}
						);
					}
				}
			}
			return { include_in_memory: false };
		} catch (error) {
			if (error instanceof Error) {
				throw createError(error.message, ActionError, {
					cause: error,
					code: 'ACTION_EXECUTION_ERROR',
					details: { action: action.toJSON() }
				});
			}
			throw error;
		}
	}

	/**
	 * Validate action before execution
	 */
	private async validateAction(action: ActionModel, browserContext: BrowserContext): Promise<void> {
		const actionData = action.toJSON();
		const [actionName, params] = Object.entries(actionData)[0] || [];

		if (!actionName) {
			throw createError('No action name provided', ValidationError);
		}

		const registeredAction = this.registry.getAction(actionName);
		if (!registeredAction) {
			throw createError(`Action "${actionName}" not registered`, ValidationError);
		}

		if (registeredAction.requiresBrowser && !browserContext) {
			throw createError(`Action "${actionName}" requires browser context`, ValidationError);
		}

		if (params) {
			await this.validateActionParams(actionName, params as Record<string, unknown>);
		}
	}

	/**
	 * Validate action parameters
	 */
	private async validateActionParams(actionName: string, params: Record<string, unknown>): Promise<void> {
		const registeredAction = this.registry.getAction(actionName);
		if (!registeredAction) {
			throw createError(`Action "${actionName}" not registered`, ValidationError);
		}

		try {
			registeredAction.paramModel.parse(params);
		} catch (error) {
			if (error instanceof z.ZodError) {
				throw createError(
					`Invalid parameters for action "${actionName}": ${error.errors.map(e => e.message).join(', ')}`,
					ValidationError,
					{
						details: {
							errors: error.errors,
							params
						}
					}
				);
			}
			throw error;
		}
	}

	/**
	 * Check if action result is valid
	 */
	private isValidActionResult(result: unknown): result is ActionResult {
		if (!result || typeof result !== 'object') {
			return false;
		}

		const { is_done, extracted_content, error, include_in_memory } = result as ActionResult;

		return (
			(typeof is_done === 'boolean' || is_done === undefined) &&
			(typeof extracted_content === 'string' || extracted_content === undefined) &&
			(typeof error === 'string' || error === undefined) &&
			typeof include_in_memory === 'boolean'
		);
	}
}
