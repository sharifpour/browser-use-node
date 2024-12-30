export class ActionModelBase {
  name!: string;

  constructor(data?: Record<string, any>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  getIndex(): number | null {
    const params = Object.values(this)[0];
    if (!params) return null;
    return 'index' in params ? params.index : null;
  }

  setIndex(index: number): void {
    const actionName = Object.keys(this)[0];
    const params = this[actionName as keyof this];
    if (params && typeof params === 'object' && 'index' in params) {
      (params as { index: number }).index = index;
    }
  }
}

export class ActionModel extends ActionModelBase {
  static getName(): string {
    return this.name;
  }

  override getIndex(): number | null {
    return super.getIndex();
  }

  override setIndex(index: number): void {
    super.setIndex(index);
  }
}

export interface RegisteredAction {
  name: string;
  description: string;
  function: (...args: any[]) => Promise<any>;
  paramModel: new (data?: Record<string, any>) => ActionModel;
  requiresBrowser: boolean;
  promptDescription(): string;
}

export class ActionRegistry {
  actions: Map<string, RegisteredAction> = new Map();

  getPromptDescription(): string {
    return Array.from(this.actions.values())
      .map(action => action.promptDescription())
      .join('\n');
  }
}
