export interface GoToUrlAction {
  url: string;
}

export interface SearchGoogleAction {
  query: string;
}

export interface ClickElementAction {
  index: number;
  xpath?: string;
}