/**
 * Tab information
 */
export interface TabInfo {
	id: string;
	url: string;
	title: string;
	active: boolean;
}

/**
 * Browser state
 */
export interface BrowserState {
	url: string;
	content: string;
	screenshot?: string;
	dom_tree: import('../../dom/element-tree').DOMElementTree;
	tabs: TabInfo[];
}

/**
 * Proxy settings
 */
export interface ProxySettings {
	server: string;
	username?: string;
	password?: string;
}

/**
 * Browser context configuration
 */
export interface BrowserContextConfig {
	/**
	 * Whether to disable security features
	 */
	disable_security?: boolean;

	/**
	 * Minimum time to wait for page load
	 */
	minimum_wait_page_load_time?: number;

	/**
	 * Maximum time to wait for page load
	 */
	maximum_wait_page_load_time?: number;

	/**
	 * Whether to disable viewport
	 */
	no_viewport?: boolean;

	/**
	 * Browser window size
	 */
	browser_window_size?: {
		width: number;
		height: number;
	};

	/**
	 * Path to save trace
	 */
	trace_path?: string;
}
