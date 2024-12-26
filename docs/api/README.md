# API Documentation

## Core Classes

### Browser
The main class for browser automation.

#### Methods
- `newContext()`: Creates a new browser context
- `close()`: Closes the browser instance
- `cleanup()`: Performs cleanup of browser resources

### BrowserContext
Represents an isolated browser context.

#### Methods
- `getPage()`: Gets the active page
- `close()`: Closes the context
- `cleanup()`: Performs cleanup of context resources

### DOMService
Service for DOM operations.

#### Methods
- `startObserving()`: Starts observing DOM mutations
- `stopObserving()`: Stops observing DOM mutations
- `cleanup()`: Performs cleanup of DOM observers
- `onMutation(handler)`: Registers a mutation event handler

### Controller
Controls browser automation actions.

#### Methods
- `registerAction(name, handler)`: Registers a new action
- `executeAction(name, params)`: Executes a registered action
- `cleanup()`: Performs cleanup of controller resources

## Actions

### Navigation
- `goto(url)`: Navigate to a URL
- `back()`: Go back in history
- `forward()`: Go forward in history
- `reload()`: Reload the current page

### Interaction
- `click(selector)`: Click an element
- `type(selector, text)`: Type text into an element
- `select(selector, value)`: Select a value in a dropdown
- `hover(selector)`: Hover over an element

### State Management
- `waitForNavigation()`: Wait for page navigation
- `waitForSelector(selector)`: Wait for an element
- `waitForNetworkIdle()`: Wait for network requests to complete

### DOM Operations
- `querySelector(selector)`: Find an element by selector
- `querySelectorAll(selector)`: Find all elements matching a selector
- `getElementText(selector)`: Get element text content
- `getElementAttribute(selector, attr)`: Get element attribute

### Resource Management
- `close()`: Close resources
- `cleanup()`: Clean up resources
- `dispose()`: Dispose of resources

## Events

### DOM Events
- `mutation`: DOM mutation event
- `navigation`: Page navigation event
- `networkIdle`: Network idle event

### Browser Events
- `close`: Browser close event
- `error`: Error event
- `console`: Console message event

## Types

### DOMElementNode
```typescript
interface DOMElementNode {
  tag: string;
  attributes: Record<string, string>;
  children: DOMElementNode[];
  parent: DOMElementNode | null;
}
```

### DOMQueryOptions
```typescript
interface DOMQueryOptions {
  waitForVisible: boolean;
  waitForEnabled: boolean;
  timeout: number;
  includeHidden: boolean;
}
```

### ElementVisibilityInfo
```typescript
interface ElementVisibilityInfo {
  isVisible: boolean;
  isInViewport: boolean;
  isClickable: boolean;
  opacity: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  computedStyle: {
    display: string;
    visibility: string;
    opacity: string;
    pointerEvents: string;
  };
  overlappingElements: DOMElementNode[];
}