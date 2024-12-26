import type { Page } from 'playwright';
import type { DOMElementNode } from './types';
import { EventEmitter } from 'node:events';

export interface MutationEvent {
    type: 'added' | 'removed' | 'modified' | 'attribute';
    target: DOMElementNode;
    oldValue?: string;
    newValue?: string;
    attributeName?: string;
}

/**
 * DOM observer manager
 */
export class DOMObserverManager extends EventEmitter {
    private isObserving: boolean = false;
    private pollInterval: NodeJS.Timeout | null = null;
    private isDestroyed: boolean = false;

    constructor(private page: Page) {
        super();
    }

    /**
     * Cleanup resources
     */
    public async cleanup(): Promise<void> {
        if (this.isDestroyed) return;

        try {
            // Stop observing
            await this.stopObserving();

            // Clear poll interval
            if (this.pollInterval) {
                clearTimeout(this.pollInterval);
                this.pollInterval = null;
            }

            // Remove all event listeners
            this.removeAllListeners();

            // Clear page reference
            this.page = null;

            // Mark as destroyed
            this.isDestroyed = true;
        } catch (error) {
            console.debug(`Failed to cleanup DOM observer manager: ${error}`);
        }
    }

    /**
     * Start observing DOM mutations
     */
    public async startObserving(): Promise<void> {
        if (this.isObserving || this.isDestroyed) return;

        await this.page.evaluate(() => {
            window.__domObserver = new MutationObserver((mutations) => {
                const events: any[] = [];

                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        // Handle added nodes
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) { // Element node
                                events.push({
                                    type: 'added',
                                    target: serializeNode(node as Element)
                                });
                            }
                        });

                        // Handle removed nodes
                        mutation.removedNodes.forEach(node => {
                            if (node.nodeType === 1) { // Element node
                                events.push({
                                    type: 'removed',
                                    target: serializeNode(node as Element)
                                });
                            }
                        });
                    } else if (mutation.type === 'attributes') {
                        events.push({
                            type: 'attribute',
                            target: serializeNode(mutation.target as Element),
                            attributeName: mutation.attributeName,
                            oldValue: mutation.oldValue,
                            newValue: (mutation.target as Element).getAttribute(mutation.attributeName!)
                        });
                    } else if (mutation.type === 'characterData') {
                        events.push({
                            type: 'modified',
                            target: serializeNode(mutation.target.parentElement as Element),
                            oldValue: mutation.oldValue,
                            newValue: mutation.target.textContent
                        });
                    }
                }

                window.dispatchEvent(new CustomEvent('__domMutation', {
                    detail: events
                }));
            });

            function serializeNode(node: Element): any {
                const attributes: Record<string, string> = {};
                for (const attr of node.attributes) {
                    attributes[attr.name] = attr.value;
                }

                return {
                    tagName: node.tagName,
                    attributes,
                    textContent: node.textContent || '',
                    highlightIndex: -1, // Will be assigned by DOM service
                    children: []
                };
            }

            window.__domObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true,
                attributeOldValue: true,
                characterDataOldValue: true
            });
        });

        // Listen for mutation events
        await this.page.evaluate(() => {
            window.addEventListener('__domMutation', (event: any) => {
                window.__domMutationEvents = event.detail;
            });
        });

        // Start polling for mutation events
        this.isObserving = true;
        this.pollMutationEvents();
    }

    /**
     * Stop observing DOM mutations
     */
    public async stopObserving(): Promise<void> {
        if (!this.isObserving || this.isDestroyed) return;

        try {
            await this.page.evaluate(() => {
                if (window.__domObserver) {
                    window.__domObserver.disconnect();
                    delete window.__domObserver;
                }

                // Remove event listener
                window.removeEventListener('__domMutation', (event: any) => {
                    window.__domMutationEvents = event.detail;
                });

                // Clear mutation events
                delete window.__domMutationEvents;
            });
        } catch (error) {
            console.debug(`Failed to stop observing: ${error}`);
        } finally {
            this.isObserving = false;
            if (this.pollInterval) {
                clearTimeout(this.pollInterval);
                this.pollInterval = null;
            }
        }
    }

    /**
     * Poll for mutation events
     */
    private async pollMutationEvents(): Promise<void> {
        if (!this.isObserving || this.isDestroyed) return;

        try {
            const events = await this.page.evaluate(() => {
                const events = window.__domMutationEvents || [];
                window.__domMutationEvents = [];
                return events;
            });

            for (const event of events) {
                this.emit('mutation', event);
            }
        } catch (error) {
            console.debug('Error polling mutation events:', error);
        }

        // Continue polling if still observing
        if (this.isObserving && !this.isDestroyed) {
            this.pollInterval = setTimeout(() => this.pollMutationEvents(), 100);
        }
    }

    /**
     * Wait for a specific element to be added to the DOM
     */
    public async waitForElement(selector: string, timeout: number = 30000): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.removeListener('mutation', handler);
                reject(new Error(`Timeout waiting for element: ${selector}`));
            }, timeout);

            const handler = (event: MutationEvent) => {
                if (event.type === 'added') {
                    this.page.$eval(selector, () => true).then(exists => {
                        if (exists) {
                            clearTimeout(timeoutId);
                            this.removeListener('mutation', handler);
                            resolve();
                        }
                    }).catch(() => {});
                }
            };

            this.on('mutation', handler);
        });
    }

    /**
     * Wait for an element to be removed from the DOM
     */
    public async waitForElementRemoval(selector: string, timeout: number = 30000): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.removeListener('mutation', handler);
                reject(new Error(`Timeout waiting for element removal: ${selector}`));
            }, timeout);

            const handler = (event: MutationEvent) => {
                if (event.type === 'removed') {
                    this.page.$eval(selector, () => true).then(() => {
                        // Element still exists
                    }).catch(() => {
                        // Element doesn't exist anymore
                        clearTimeout(timeoutId);
                        this.removeListener('mutation', handler);
                        resolve();
                    });
                }
            };

            this.on('mutation', handler);
        });
    }

    /**
     * Wait for an attribute to change on an element
     */
    public async waitForAttributeChange(
        selector: string,
        attributeName: string,
        timeout: number = 30000
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.removeListener('mutation', handler);
                reject(new Error(`Timeout waiting for attribute change: ${selector}[${attributeName}]`));
            }, timeout);

            const handler = (event: MutationEvent) => {
                if (
                    event.type === 'attribute' &&
                    event.attributeName === attributeName
                ) {
                    this.page.$eval(selector, () => true).then(exists => {
                        if (exists) {
                            clearTimeout(timeoutId);
                            this.removeListener('mutation', handler);
                            resolve();
                        }
                    }).catch(() => {});
                }
            };

            this.on('mutation', handler);
        });
    }
}