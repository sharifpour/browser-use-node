/**
 * Build a DOM tree with interactive elements highlighted
 */

import type { DOMElementNode } from "./types";

interface ComputedStyle {
    display: string;
    visibility: string;
    opacity: string;
}

type WindowWithComputedStyle = Window & {
    getComputedStyle(element: Element): ComputedStyle;
    readonly innerHeight: number;
}

export const buildDomTree = (): string => `
(() => {
    // Helper function to check if element is visible
    function isElementVisible(element: Element): boolean {
        if (!element) return false;

        const style = (window as WindowWithComputedStyle).getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.opacity !== "0" &&
            rect.width > 0 &&
            rect.height > 0 &&
            rect.top >= 0 &&
            rect.top <= (window as WindowWithComputedStyle).innerHeight
        );
    }

    // Helper function to generate XPath
    function getXPath(element: Element): string {
        if (element.id) {
            return \`//*[@id="\${element.id}"]\`;
        }

        const parts: string[] = [];
        let current: Element | null = element;

        while (current && current.nodeType === Node.ELEMENT_NODE) {
            let index = 0;
            let sibling = current.previousSibling;

            while (sibling) {
                if (
                    sibling.nodeType === Node.ELEMENT_NODE &&
                    (sibling as Element).nodeName === current.nodeName
                ) {
                    index++;
                }
                sibling = sibling.previousSibling;
            }

            const tagName = current.nodeName.toLowerCase();
            const xpathIndex = index > 0 ? \`[\${index + 1}]\` : "";
            parts.unshift(\`\${tagName}\${xpathIndex}\`);

            current = current.parentElement;
        }

        return \`/\${parts.join("/")}\`;
    }

    // Helper function to check if element is interactive
    function isInteractiveElement(element: Element): boolean {
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
            element.hasAttribute("onclick") ||
            element.hasAttribute("ng-click") ||
            element.hasAttribute("@click") ||
            element.hasAttribute("v-on:click")
        );
    }

    interface ProcessedNode {
        tagName: string;
        isVisible: boolean;
        isInteractive: boolean;
        xpath: string;
        attributes: Record<string, string>;
        children: ProcessedNode[];
        text?: string;
        shadowRoot: boolean;
        location: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        highlightIndex?: number;
    }

    // Process a DOM node
    function processNode(node: Element, currentIndex: number): ProcessedNode | null {
        if (node.nodeType !== Node.ELEMENT_NODE) {
            return null;
        }

        const isVisible = isElementVisible(node);
        const isInteractive = isInteractiveElement(node);
        const rect = node.getBoundingClientRect();

        const result: ProcessedNode = {
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
        for (const attr of Array.from(node.attributes)) {
            result.attributes[attr.name] = attr.value;
        }

        let nextIndex = currentIndex;

        // Add highlight index for interactive elements
        if (isInteractive && isVisible) {
            result.highlightIndex = nextIndex;
            nextIndex++;
        }

        // Process children
        for (const child of Array.from(node.children)) {
            const childNode = processNode(child, nextIndex);
            if (childNode) {
                result.children.push(childNode);
                if (childNode.highlightIndex) {
                    nextIndex = childNode.highlightIndex + 1;
                }
            }
        }

        return result;
    }

    // Start processing from document root
    return processNode(document.documentElement, 1);
})()`;

export function parseEvaluatedTree(evalResult: unknown): DOMElementNode | null {
    if (!evalResult || typeof evalResult !== 'object') {
        return null;
    }

    const node = evalResult as Record<string, unknown>;

    return {
        tagName: String(node.tagName || ''),
        isVisible: Boolean(node.isVisible),
        parent: null, // Will be set by parent
        xpath: String(node.xpath || ''),
        attributes: (node.attributes as Record<string, string>) || {},
        children: Array.isArray(node.children)
            ? node.children
                .map(child => parseEvaluatedTree(child))
                .filter((child): child is DOMElementNode => child !== null)
            : [],
        isInteractive: Boolean(node.isInteractive),
        isTopElement: false, // This will be set by the parent if needed
        shadowRoot: Boolean(node.shadowRoot),
        highlightIndex: typeof node.highlightIndex === 'number' ? node.highlightIndex : undefined,
        location: node.location as DOMElementNode['location'],
        isClickable: Boolean(node.isInteractive) // Set isClickable based on isInteractive
    };
}