// Function that will be injected into the page
export const buildDomTreeFn = `function(doHighlightElements = true) {
	let highlightIndex = 0;

	// Helper function to highlight elements
	function highlightElement(element, index) {
		// Create or get highlight container
		let container = document.getElementById('playwright-highlight-container');
		if (!container) {
			container = document.createElement('div');
			container.id = 'playwright-highlight-container';
			container.style.position = 'fixed';
			container.style.pointerEvents = 'none';
			container.style.top = '0';
			container.style.left = '0';
			container.style.width = '100%';
			container.style.height = '100%';
			container.style.zIndex = '2147483647';
			document.documentElement.appendChild(container);
		}

		// Generate a color based on the index
		const colors = [
			'#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080',
			'#008080', '#FF69B4', '#4B0082', '#FF4500', '#2E8B57'
		];
		const colorIndex = index % colors.length;
		const baseColor = colors[colorIndex];
		const backgroundColor = baseColor + '1A';

		// Create highlight overlay
		const overlay = document.createElement('div');
		overlay.style.position = 'absolute';
		overlay.style.border = \`2px solid \${baseColor}\`;
		overlay.style.backgroundColor = backgroundColor;
		overlay.style.borderRadius = '3px';
		overlay.style.pointerEvents = 'none';
		overlay.style.zIndex = '2147483647';
		overlay.setAttribute('data-highlight', 'true');

		// Add index label
		const label = document.createElement('div');
		label.style.position = 'absolute';
		label.style.top = '-20px';
		label.style.left = '0';
		label.style.backgroundColor = baseColor;
		label.style.color = 'white';
		label.style.padding = '2px 6px';
		label.style.borderRadius = '3px';
		label.style.fontSize = '12px';
		label.textContent = index.toString();
		overlay.appendChild(label);

		// Position the overlay
		const rect = element.getBoundingClientRect();
		overlay.style.width = rect.width + 'px';
		overlay.style.height = rect.height + 'px';
		overlay.style.top = rect.top + window.scrollY + 'px';
		overlay.style.left = rect.left + window.scrollX + 'px';

		container.appendChild(overlay);
	}

	// Helper function to check if element is interactive
	function isInteractiveElement(element) {
		const interactiveTags = new Set([
			'a', 'button', 'input', 'select', 'textarea', 'details',
			'dialog', 'menu', 'menuitem', 'option', 'optgroup'
		]);

		const interactiveRoles = new Set([
			'button', 'checkbox', 'combobox', 'gridcell', 'link', 'menuitem',
			'menuitemcheckbox', 'menuitemradio', 'option', 'radio', 'searchbox',
			'slider', 'spinbutton', 'switch', 'tab', 'textbox', 'treeitem'
		]);

		// Check tag name
		if (interactiveTags.has(element.tagName.toLowerCase())) {
			return true;
		}

		// Check role attribute
		const role = element.getAttribute('role');
		if (role && interactiveRoles.has(role.toLowerCase())) {
			return true;
		}

		// Check for click handlers
		const clickHandlers = element.getAttribute('onclick') ||
			element.getAttribute('onmousedown') ||
			element.getAttribute('onmouseup');
		if (clickHandlers) {
			return true;
		}

		// Check for pointer cursor style
		const computedStyle = window.getComputedStyle(element);
		if (computedStyle.cursor === 'pointer') {
			return true;
		}

		// Check for tabindex
		const tabIndex = element.getAttribute('tabindex');
		if (tabIndex !== null && tabIndex !== '-1') {
			return true;
		}

		return false;
	}

	// Helper function to check if element is visible
	function isElementVisible(element) {
		const style = window.getComputedStyle(element);
		return element.offsetWidth > 0 && element.offsetHeight > 0 &&
			style.visibility !== 'hidden' && style.display !== 'none';
	}

	// Helper function to check if element is the top element at its position
	function isTopElement(element) {
		const rect = element.getBoundingClientRect();
		const point = {
			x: rect.left + rect.width / 2,
			y: rect.top + rect.height / 2
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

	// Helper function to generate XPath
	function getXPath(element) {
		const segments = [];
		let current = element;

		while (current && current.nodeType === Node.ELEMENT_NODE) {
			let index = 0;
			let sibling = current.previousSibling;
			while (sibling) {
				if (sibling.nodeType === Node.ELEMENT_NODE &&
					sibling.nodeName === current.nodeName) {
					index++;
				}
				sibling = sibling.previousSibling;
			}

			const tagName = current.nodeName.toLowerCase();
			const xpathIndex = index > 0 ? \`[\${index + 1}]\` : '';
			segments.unshift(\`\${tagName}\${xpathIndex}\`);

			current = current.parentNode;
		}

		return segments.join('/');
	}

	// Function to traverse the DOM and create nested JSON
	function traverseDOM(node) {
		if (!node) return null;

		if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent.trim();
			if (text) {
				return {
					type: 'TEXT_NODE',
					text: text,
					isVisible: true
				};
			}
			return null;
		}

		if (node.nodeType !== Node.ELEMENT_NODE) {
			return null;
		}

		const isVisible = isElementVisible(node);
		const isInteractive = isInteractiveElement(node);
		const isTop = isTopElement(node);

		const nodeData = {
			type: 'ELEMENT_NODE',
			tagName: node.tagName.toLowerCase(),
			attributes: {},
			xpath: getXPath(node),
			children: [],
			isInteractive,
			isVisible,
			isTopElement: isTop,
			shadowRoot: false
		};

		// Get attributes
		if (node.attributes) {
			for (const attr of node.attributes) {
				nodeData.attributes[attr.name] = attr.value;
			}
		}

		// Add highlight index for interactive elements
		if (isInteractive && isVisible && isTop) {
			nodeData.highlightIndex = highlightIndex++;
			if (doHighlightElements) {
				highlightElement(node, nodeData.highlightIndex);
			}
		}

		// Process children
		if (node.shadowRoot) {
			nodeData.shadowRoot = true;
			const shadowChildren = Array.from(node.shadowRoot.childNodes)
				.map(traverseDOM)
				.filter(Boolean);
			nodeData.children.push(...shadowChildren);
		}

		const children = Array.from(node.childNodes)
			.map(traverseDOM)
			.filter(Boolean);
		nodeData.children.push(...children);

		return nodeData;
	}

	// Start traversal from document.documentElement to include <html> and <head>
	return traverseDOM(document.documentElement);
}`;

