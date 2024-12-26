/**
 * DOM module exports
 */

export * from "./types";
export { DOMService } from "./service";
export { DOMObserver } from "./observer";

// Tree processing utilities
export {
    convertDOMElementToHistoryElement,
    findHistoryElementInTree,
} from "./tree-processor";
