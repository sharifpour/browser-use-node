"use strict";
/**
 * Main library exports
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOMObserver = exports.Controller = exports.BrowserContext = exports.Browser = exports.Agent = void 0;
var agent_1 = require("./agent/agent");
Object.defineProperty(exports, "Agent", { enumerable: true, get: function () { return agent_1.Agent; } });
var browser_1 = require("./browser/browser");
Object.defineProperty(exports, "Browser", { enumerable: true, get: function () { return browser_1.Browser; } });
var context_1 = require("./browser/context");
Object.defineProperty(exports, "BrowserContext", { enumerable: true, get: function () { return context_1.BrowserContext; } });
var controller_1 = require("./controller/controller");
Object.defineProperty(exports, "Controller", { enumerable: true, get: function () { return controller_1.Controller; } });
var observer_1 = require("./dom/observer");
Object.defineProperty(exports, "DOMObserver", { enumerable: true, get: function () { return observer_1.DOMObserver; } });
