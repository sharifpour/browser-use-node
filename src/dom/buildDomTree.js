/**
 * Build a DOM tree with interactive elements highlighted
 */
() => {
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

	// Helper function to generate XPath
	function getXPath(element) {
		if (element.id) {
			return `//*[@id="${element.id}"]`;
		}

		const parts = [];
		let current = element;

		while (current && current.nodeType === Node.ELEMENT_NODE) {
			let index = 0;
			let sibling = current.previousSibling;

			while (sibling) {
				if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === current.nodeName) {
					index++;
				}
				sibling = sibling.previousSibling;
			}

			const tagName = current.nodeName.toLowerCase();
			const xpathIndex = index > 0 ? `[${index + 1}]` : "";
			parts.unshift(`${tagName}${xpathIndex}`);

			current = current.parentNode;
		}

		return `/${parts.join("/")}`;
	}

	// Helper function to check if element is interactive
	function isInteractiveElement(element) {
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
			"option"
		]);

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
			"tab"
		]);

		const tagName = element.tagName.toLowerCase();
		const role = element.getAttribute("role");

		return (
			interactiveTags.has(tagName) ||
			(role && interactiveRoles.has(role)) ||
			element.onclick !== null ||
			element.getAttribute("onclick") !== null ||
			element.hasAttribute("ng-click") ||
			element.hasAttribute("@click") ||
			element.hasAttribute("v-on:click")
		);
	}

	// Process a DOM node
	function processNode(node, index = 1) {
		if (node.nodeType !== Node.ELEMENT_NODE) {
			return null;
		}

		const isVisible = isElementVisible(node);
		const isInteractive = isInteractiveElement(node);
		const rect = node.getBoundingClientRect();

		const result = {
			tagName: node.nodeName.toLowerCase(),
			isVisible,
			isInteractive,
			xpath: getXPath(node),
			attributes: {},
			children: [],
			text: node.textContent?.trim(),
			shadowRoot: !!node.shadowRoot,
			location: {
				x: rect.x,
				y: rect.y,
				width: rect.width,
				height: rect.height
			}
		};

		// Add attributes
		for (const attr of node.attributes) {
			result.attributes[attr.name] = attr.value;
		}

		// Add highlight index for interactive elements
		if (isInteractive && isVisible) {
			result.highlightIndex = index++;
		}

		// Process children
		for (const child of node.children) {
			const childNode = processNode(child, index);
			if (childNode) {
				result.children.push(childNode);
				if (childNode.highlightIndex) {
					index = childNode.highlightIndex + 1;
				}
			}
		}

		return result;
	}

	// Start processing from document root
	return processNode(document.documentElement);
};
