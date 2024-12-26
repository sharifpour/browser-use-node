import type { ActionModel } from '../controller/registry/types';
import type { AgentBrain } from './types';

export interface IAgentOutput {
    current_state: AgentBrain;
    action: ActionModel[];
}

export class AgentOutput implements IAgentOutput {
    current_state!: AgentBrain;
    action!: ActionModel[];

    constructor() {
        this.current_state = { evaluation_previous_goal: '', memory: '', next_goal: '' };
        this.action = [];
    }

    static typeWithCustomActions<T extends ActionModel>(_actionModel: T): typeof AgentOutput {
        return class extends AgentOutput {
            action!: T[];
            constructor() {
                super();
                this.action = [] as T[];
            }
        };
    }
}

export const AgentError = {
    VALIDATION_ERROR: 'Invalid model output format. Please follow the correct schema.',
    RATE_LIMIT_ERROR: 'Rate limit reached. Waiting before retry.',
    NO_VALID_ACTION: 'No valid action found',

    formatError(error: Error, includeTrace = false): string {
        const message = error.message;
        if (includeTrace && error.stack) {
            return `${message}\n${error.stack}`;
        }
        return message;
    }
} as const;
