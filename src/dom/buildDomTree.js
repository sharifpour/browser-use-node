// Python source reference:
// """
// Build DOM tree.
// """
//
// function buildDomTree(highlightElements) {
//     let highlightIndex = 0;
//     const isVisible = (element) => {
//         if (!(element instanceof Element)) return true;
//         const style = window.getComputedStyle(element);
//         return style.display !== 'none' &&
//             style.visibility !== 'hidden' &&
//             style.opacity !== '0' &&
//             element.offsetWidth > 0 &&
//             element.offsetHeight > 0;
//     };
//
//     const isInteractive = (element) => {
//         if (!(element instanceof Element)) return false;
//         const tagName = element.tagName.toLowerCase();
//         const type = element.getAttribute('type')?.toLowerCase();
//         const role = element.getAttribute('role')?.toLowerCase();
//
//         // Check if element is naturally interactive
//         if (['a', 'button', 'input', 'select', 'textarea'].includes(tagName)) return true;
//
//         // Check for ARIA roles that indicate interactivity
//         if (role && ['button', 'link', 'menuitem', 'tab'].includes(role)) return true;
//
//         // Check for event listeners
//         const hasClickListener = element.onclick !== null || element._click !== undefined;
//         if (hasClickListener) return true;
//
//         // Check for cursor style
//         const style = window.getComputedStyle(element);
//         if (style.cursor === 'pointer') return true;
//
//         return false;
//     };
//
//     const getAttributes = (element) => {
//         if (!(element instanceof Element)) return {};
//         const attributes = {};
//         for (const attr of element.attributes) {
//             attributes[attr.name] = attr.value;
//         }
//         return attributes;
//     };
//
//     const getXPath = (element) => {
//         if (!(element instanceof Element)) return '';
//         const paths = [];
//         let current = element;
//
//         while (current && current.nodeType === Node.ELEMENT_NODE) {
//             let index = 0;
//             let hasFollowingSibling = false;
//             for (let sibling = current.previousSibling; sibling; sibling = sibling.previousSibling) {
//                 if (sibling.nodeType !== Node.DOCUMENT_TYPE_NODE &&
//                     sibling.nodeName === current.nodeName) {
//                     index++;
//                 }
//             }
//
//             for (let sibling = current.nextSibling; sibling && !hasFollowingSibling; sibling = sibling.nextSibling) {
//                 if (sibling.nodeName === current.nodeName) {
//                     hasFollowingSibling = true;
//                 }
//             }
//
//             const tagName = current.nodeName.toLowerCase();
//             const pathIndex = (index || hasFollowingSibling) ? `[${index + 1}]` : '';
//             paths.unshift(tagName + pathIndex);
//
//             if (current.id) {
//                 paths = [`//*[@id='${current.id}']`];
//                 break;
//             }
//
//             current = current.parentNode;
//         }
//
//         return '/' + paths.join('/');
//     };
//
//     const processNode = (node) => {
//         if (node.nodeType === Node.TEXT_NODE) {
//             const text = node.textContent.trim();
//             if (!text) return null;
//
//             return {
//                 type: 'TEXT_NODE',
//                 text,
//                 isVisible: isVisible(node.parentElement)
//             };
//         }
//
//         if (node.nodeType !== Node.ELEMENT_NODE) return null;
//
//         const element = node;
//         const visible = isVisible(element);
//         const interactive = isInteractive(element);
//
//         // Skip invisible and non-interactive elements and their children
//         if (!visible && !interactive) return null;
//
//         const children = [];
//         for (const child of element.childNodes) {
//             const processedChild = processNode(child);
//             if (processedChild) {
//                 children.push(processedChild);
//             }
//         }
//
//         const result = {
//             tagName: element.tagName.toLowerCase(),
//             xpath: getXPath(element),
//             attributes: getAttributes(element),
//             isVisible: visible,
//             isInteractive: interactive,
//             children
//         };
//
//         if (highlightElements && interactive) {
//             result.highlightIndex = highlightIndex++;
//             element.setAttribute('data-highlight', result.highlightIndex.toString());
//             element.style.outline = '2px solid red';
//             element.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
//         }
//
//         return result;
//     };
//
//     return processNode(document.documentElement);
// }

function buildDomTree(highlightElements) {
	let highlightIndex = 0;

	const isVisible = (element) => {
		if (!(element instanceof Element)) return true;
		const style = window.getComputedStyle(element);
		return (
			style.display !== 'none' &&
			style.visibility !== 'hidden' &&
			style.opacity !== '0' &&
			element.offsetWidth > 0 &&
			element.offsetHeight > 0
		);
	};

	const isInteractive = (element) => {
		if (!(element instanceof Element)) return false;
		const tagName = element.tagName.toLowerCase();
		const type = element.getAttribute('type')?.toLowerCase();
		const role = element.getAttribute('role')?.toLowerCase();

		// Check if element is naturally interactive
		if (['a', 'button', 'input', 'select', 'textarea'].includes(tagName)) return true;

		// Check for ARIA roles that indicate interactivity
		if (role && ['button', 'link', 'menuitem', 'tab'].includes(role)) return true;

		// Check for event listeners
		const hasClickListener = element.onclick !== null || element._click !== undefined;
		if (hasClickListener) return true;

		// Check for cursor style
		const style = window.getComputedStyle(element);
		if (style.cursor === 'pointer') return true;

		return false;
	};

	const getAttributes = (element) => {
		if (!(element instanceof Element)) return {};
		const attributes = {};
		for (const attr of element.attributes) {
			attributes[attr.name] = attr.value;
		}
		return attributes;
	};

	const getXPath = (element) => {
		if (!(element instanceof Element)) return '';
		let paths = [];
		let current = element;

		while (current && current.nodeType === Node.ELEMENT_NODE) {
			let index = 0;
			let hasFollowingSibling = false;
			for (let sibling = current.previousSibling; sibling; sibling = sibling.previousSibling) {
				if (sibling.nodeType !== Node.DOCUMENT_TYPE_NODE && sibling.nodeName === current.nodeName) {
					index++;
				}
			}

			for (let sibling = current.nextSibling; sibling && !hasFollowingSibling; sibling = sibling.nextSibling) {
				if (sibling.nodeName === current.nodeName) {
					hasFollowingSibling = true;
				}
			}

			const tagName = current.nodeName.toLowerCase();
			const pathIndex = index || hasFollowingSibling ? `[${index + 1}]` : '';
			paths.unshift(tagName + pathIndex);

			if (current.id) {
				paths = [`//*[@id='${current.id}']`];
				break;
			}

			current = current.parentNode;
		}

		return '/' + paths.join('/');
	};

	const processNode = (node) => {
		if (node.nodeType === Node.TEXT_NODE) {
			const text = node.textContent.trim();
			if (!text) return null;

			return {
				type: 'TEXT_NODE',
				text,
				isVisible: isVisible(node.parentElement)
			};
		}

		if (node.nodeType !== Node.ELEMENT_NODE) return null;

		const element = node;
		const visible = isVisible(element);
		const interactive = isInteractive(element);

		// Skip invisible and non-interactive elements and their children
		if (!visible && !interactive) return null;

		const children = [];
		for (const child of element.childNodes) {
			const processedChild = processNode(child);
			if (processedChild) {
				children.push(processedChild);
			}
		}

		const result = {
			tagName: element.tagName.toLowerCase(),
			xpath: getXPath(element),
			attributes: getAttributes(element),
			isVisible: visible,
			isInteractive: interactive,
			children
		};

		if (highlightElements && interactive) {
			result.highlightIndex = highlightIndex++;
			element.setAttribute('data-highlight', result.highlightIndex.toString());
			element.style.outline = '2px solid red';
			element.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
		}

		return result;
	};

	return processNode(document.documentElement);
}