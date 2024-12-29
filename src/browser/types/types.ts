import type { Page, BrowserContext as PlaywrightContext } from 'playwright';
import type { DOMElementNode } from '../../dom/types';

export interface TabInfo {
	id: number;
	title: string;
	url: string;
	active: boolean;
}

export interface BrowserState {
	element_tree: DOMElementNode;
	selector_map: Record<number, DOMElementNode>;
	url: string;
	title: string;
	content: string;
	tabs: TabInfo[];
	screenshot?: string | null;
}

export interface BrowserSession {
	context: PlaywrightContext;
	current_page: Page;
	cached_state: BrowserState;
}

export interface DOMState {
	element_tree: DOMElementNode;
	selector_map: Record<number, DOMElementNode>;
}

export interface HashedDomElement {
	branch_path_hash: string;
	attributes_hash: string;
}

export interface DOMHistoryElement {
	tag_name: string;
	xpath: string;
	highlight_index: number | null;
	entire_parent_branch_path: string[];
	attributes: Record<string, string>;
	shadow_root: boolean;
}
