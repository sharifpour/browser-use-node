var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? (o, m, k, k2) => {
				if (k2 === undefined) k2 = k;
				var desc = Object.getOwnPropertyDescriptor(m, k);
				if (
					!desc ||
					("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
				) {
					desc = { enumerable: true, get: () => m[k] };
				}
				Object.defineProperty(o, k2, desc);
			}
		: (o, m, k, k2) => {
				if (k2 === undefined) k2 = k;
				o[k2] = m[k];
			});
var __exportStar =
	(this && this.__exportStar) ||
	((m, exports) => {
		for (var p in m)
			if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p))
				__createBinding(exports, m, p);
	});
var __importDefault =
	(this && this.__importDefault) ||
	((mod) => (mod && mod.__esModule ? mod : { default: mod }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserUse = void 0;
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const python_shell_1 = require("python-shell");
const types_1 = require("./types");
class BrowserUse {
	constructor(config) {
		this.history = [];
		// Get absolute paths
		this.pythonPath = node_path_1.default.resolve(
			__dirname,
			"..",
			"venv",
			"bin",
			"python",
		);
		this.scriptPath = node_path_1.default.resolve(
			__dirname,
			"..",
			"src",
			"bridge.py",
		);
		this.config = types_1.BrowserConfigSchema.parse(config ?? {});
		// Verify paths exist
		if (!node_fs_1.default.existsSync(this.pythonPath)) {
			console.error("Current directory:", process.cwd());
			console.error("__dirname:", __dirname);
			throw new Error(`Python executable not found at: ${this.pythonPath}`);
		}
		if (!node_fs_1.default.existsSync(this.scriptPath)) {
			console.error("Current directory:", process.cwd());
			console.error("__dirname:", __dirname);
			throw new Error(`Bridge script not found at: ${this.scriptPath}`);
		}
		console.log("Initialized with paths:", {
			pythonPath: this.pythonPath,
			scriptPath: this.scriptPath,
			cwd: process.cwd(),
			dirname: __dirname,
		});
	}
	createPyShell(args) {
		const options = {
			pythonPath: this.pythonPath,
			mode: "text",
			args: [...args],
		};
		console.log("Creating Python shell with:", {
			script: this.scriptPath,
			pythonPath: this.pythonPath,
			args,
		});
		return new python_shell_1.PythonShell(this.scriptPath, options);
	}
	async executeCommand(command, args = {}) {
		return new Promise((resolve, reject) => {
			let isDisposed = false;
			const pyshell = this.createPyShell([command, JSON.stringify(args)]);
			let jsonBuffer = "";
			let isCollectingJson = false;
			const cleanup = () => {
				if (!isDisposed) {
					isDisposed = true;
					pyshell.terminate();
				}
			};
			const handleLog = (message) => {
				if (message.startsWith("LOG:")) {
					console.log("[Browser-Use]", message.slice(4).trim());
				}
			};
			const handleMessage = (message) => {
				if (message.startsWith("JSON_START")) {
					isCollectingJson = true;
					jsonBuffer = "";
				} else if (message.endsWith("JSON_END")) {
					isCollectingJson = false;
					try {
						const jsonStr = jsonBuffer + message.slice(0, -8);
						const response = JSON.parse(jsonStr);
						this.history.push({
							action: command,
							timestamp: new Date(),
							success: response.status === "success",
							details: response.data
								? { data: response.data }
								: response.message
									? { message: response.message }
									: { status: response.status },
						});
						resolve(response);
						cleanup();
					} catch (error) {
						cleanup();
						reject(new Error("Failed to parse JSON response"));
					}
				} else if (isCollectingJson) {
					jsonBuffer += message;
				}
			};
			const handleError = (source, error) => {
				const errorDetails = {
					action: command,
					timestamp: new Date(),
					success: false,
					details: { error: error.message, source },
				};
				this.history.push(errorDetails);
				cleanup();
				reject(new Error(`${source}: ${error.message}`));
			};
			pyshell.on("stderr", handleLog);
			pyshell.on("message", handleMessage);
			pyshell.on("error", (err) => handleError("Node.js", err));
			pyshell.on("stderrLine", (line) => {
				if (!line.startsWith("LOG:")) {
					handleError("Python", new Error(line.trim()));
				}
			});
			// Set timeout to prevent hanging
			setTimeout(() => {
				if (!isDisposed) {
					handleError(
						"Timeout",
						new Error("Command timed out after 30 seconds"),
					);
				}
			}, 30000);
		});
	}
	async initialize() {
		const response = await this.executeCommand("initialize", this.config);
		if (response.status === "error") {
			throw new Error(response.message ?? "Failed to initialize browser");
		}
	}
	async createAgent(config) {
		return this.executeCommand("create_agent", config);
	}
	async runAgent(params) {
		return this.executeCommand("run_agent", params);
	}
	async getHistory() {
		return Object.freeze([...this.history]);
	}
	async close() {
		try {
			await this.executeCommand("close");
		} finally {
			// Ensure cleanup even if close command fails
			this.history.length = 0;
		}
	}
}
exports.BrowserUse = BrowserUse;
__exportStar(require("./types"), exports);
