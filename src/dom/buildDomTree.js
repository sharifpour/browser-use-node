/**
 * Build a DOM tree with interactive elements highlighted
 */
(doHighlightElements = true) => {
	let highlightIndex = 0;

	// Helper function to check if element is visible
	function isElementVisible(element) {
		if (!element) return false;

		const style = window.getComputedStyle(element);
		const rect = element.getBoundingClientRect();

		return (
			style.display !== "none" &&
			style.visibility !== "hidden" &&
			style.opacity !== "0" &&
			rect.width > 0 &&
			rect.height > 0 &&
			rect.top >= 0 &&
			rect.top <= window.innerHeight
		);
	}

	// Helper function to generate XPath as a tree
	function getXPathTree(element, stopAtBoundary = true) {
		const segments = [];
		let currentElement = element;

		while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
			// Stop if we hit a shadow root or iframe
			if (
				stopAtBoundary &&
				(currentElement.parentNode instanceof ShadowRoot ||
					currentElement.parentNode instanceof HTMLIFrameElement)
			) {
				break;
			}

			let index = 0;
			let sibling = currentElement.previousSibling;
			while (sibling) {
				if (
					sibling.nodeType === Node.ELEMENT_NODE &&
					sibling.nodeName === currentElement.nodeName
				) {
					index++;
				}
				sibling = sibling.previousSibling;
			}

			const tagName = currentElement.nodeName.toLowerCase();
			const xpathIndex = index > 0 ? `[${index + 1}]` : "";
			segments.unshift(`${tagName}${xpathIndex}`);

			currentElement = currentElement.parentNode;
		}

		return segments.join("/");
	}

	// Helper function to check if element is accepted
	function isElementAccepted(element) {
		const leafElementDenyList = new Set([
			"svg",
			"script",
			"style",
			"link",
			"meta",
		]);
		return !leafElementDenyList.has(element.tagName.toLowerCase());
	}

	// Helper function to check if element is interactive
	function isInteractiveElement(element) {
		// Check for common interactive elements
		const interactiveTags = new Set([
			"a",
			"button",
			"input",
			"select",
			"textarea",
			"details",
			"dialog",
			"menu",
			"menuitem",
			"option",
			"video",
			"audio",
		]);

		if (interactiveTags.has(element.tagName.toLowerCase())) return true;

		// Check for interactive roles
		const interactiveRoles = new Set([
			"button",
			"link",
			"checkbox",
			"menuitem",
			"menuitemcheckbox",
			"menuitemradio",
			"option",
			"radio",
			"searchbox",
			"switch",
			"tab",
		]);

		const role = element.getAttribute("role");
		const hasInteractiveRole = role && interactiveRoles.has(role.toLowerCase());

		if (hasInteractiveRole) return true;

		// Check for event listeners
		const hasClickHandler =
			element.onclick !== null ||
			element.getAttribute("onclick") !== null ||
			element.hasAttribute("ng-click") ||
			element.hasAttribute("@click") ||
			element.hasAttribute("v-on:click");

		// Helper function to safely get event listeners
		function getEventListeners(el) {
			try {
				return window.getEventListeners?.(el) || {};
			} catch (e) {
				const listeners = {};
				const eventTypes = [
					"click",
					"mousedown",
					"mouseup",
					"touchstart",
					"touchend",
					"keydown",
					"keyup",
					"focus",
					"blur",
				];

				for (const type of eventTypes) {
					const handler = el[`on${type}`];
					if (handler) {
						listeners[type] = [
							{
								listener: handler,
								useCapture: false,
							},
						];
					}
				}

				return listeners;
			}
		}

		// Check for click-related events
		const listeners = getEventListeners(element);
		const hasClickListeners =
			listeners &&
			(listeners.click?.length > 0 ||
				listeners.mousedown?.length > 0 ||
				listeners.mouseup?.length > 0 ||
				listeners.touchstart?.length > 0 ||
				listeners.touchend?.length > 0);

		// Check for ARIA properties
		const hasAriaProps =
			element.hasAttribute("aria-expanded") ||
			element.hasAttribute("aria-pressed") ||
			element.hasAttribute("aria-selected") ||
			element.hasAttribute("aria-checked");

		// Check if element is draggable
		const isDraggable =
			element.draggable || element.getAttribute("draggable") === "true";

		return hasAriaProps || hasClickHandler || hasClickListeners || isDraggable;
	}

	// Helper function to check if element is the top element at its position
	function isTopElement(element) {
		// Find the correct document context and root element
		const doc = element.ownerDocument;

		// If we're in an iframe, elements are considered top by default
		if (doc !== window.document) {
			return true;
		}

		// For shadow DOM, we need to check within its own root context
		const shadowRoot = element.getRootNode();
		if (shadowRoot instanceof ShadowRoot) {
			const rect = element.getBoundingClientRect();
			const point = {
				x: rect.left + rect.width / 2,
				y: rect.top + rect.height / 2,
			};

			try {
				const topEl = shadowRoot.elementFromPoint(point.x, point.y);
				if (!topEl) return false;

				let current = topEl;
				while (current && current !== shadowRoot) {
					if (current === element) return true;
					current = current.parentElement;
				}
				return false;
			} catch (e) {
				return true; // If we can't determine, consider it visible
			}
		}

		// Regular DOM elements
		const rect = element.getBoundingClientRect();
		const point = {
			x: rect.left + rect.width / 2,
			y: rect.top + rect.height / 2,
		};

		try {
			const topEl = document.elementFromPoint(point.x, point.y);
			if (!topEl) return false;

			let current = topEl;
			while (current && current !== document.documentElement) {
				if (current === element) return true;
				current = current.parentElement;
			}
			return false;
		} catch (e) {
			return true;
		}
	}

	// Helper function to check if text node is visible
	function isTextNodeVisible(textNode) {
		const range = document.createRange();
		range.selectNodeContents(textNode);
		const rect = range.getBoundingClientRect();

		return (
			rect.width !== 0 &&
			rect.height !== 0 &&
			rect.top >= 0 &&
			rect.top <= window.innerHeight &&
			textNode.parentElement?.checkVisibility({
				checkOpacity: true,
				checkVisibilityCSS: true,
			})
		);
	}

	// Function to traverse the DOM and create nested JSON
	function buildDomTree(node, parentIframe = null) {
		if (!node) return null;

		// Special case for text nodes
		if (node.nodeType === Node.TEXT_NODE) {
			const textContent = node.textContent.trim();
			if (textContent && isTextNodeVisible(node)) {
				return {
					type: "TEXT_NODE",
					text: textContent,
					isVisible: true,
				};
			}
			return null;
		}

		// Check if element is accepted
		if (node.nodeType === Node.ELEMENT_NODE && !isElementAccepted(node)) {
			return null;
		}

		const nodeData = {
			tagName: node.tagName ? node.tagName.toLowerCase() : null,
			attributes: {},
			xpath:
				node.nodeType === Node.ELEMENT_NODE ? getXPathTree(node, true) : null,
			children: [],
		};

		// Copy all attributes if the node is an element
		if (node.nodeType === Node.ELEMENT_NODE && node.attributes) {
			const attributeNames = node.getAttributeNames?.() || [];
			for (const name of attributeNames) {
				nodeData.attributes[name] = node.getAttribute(name);
			}
		}

		if (node.nodeType === Node.ELEMENT_NODE) {
			const isInteractive = isInteractiveElement(node);
			const isVisible = isElementVisible(node);
			const isTop = isTopElement(node);

			nodeData.isInteractive = isInteractive;
			nodeData.isVisible = isVisible;
			nodeData.isTopElement = isTop;

			// Highlight if element meets all criteria and highlighting is enabled
			if (isInteractive && isVisible && isTop) {
				nodeData.highlightIndex = highlightIndex++;
				if (doHighlightElements) {
					node.setAttribute(
						"data-highlight-index",
						nodeData.highlightIndex.toString(),
					);
				}
			}
		}

		// Handle shadow DOM
		if (node.shadowRoot) {
			nodeData.shadowRoot = true;
			const shadowChildren = Array.from(node.shadowRoot.childNodes)
				.map((child) => buildDomTree(child, parentIframe))
				.filter(Boolean);
			nodeData.children.push(...shadowChildren);
		}

		// Handle regular children
		const children = Array.from(node.childNodes)
			.map((child) => buildDomTree(child, parentIframe))
			.filter(Boolean);
		nodeData.children.push(...children);

		return nodeData;
	}

	// Start building from document body
	return buildDomTree(document.body);
};
