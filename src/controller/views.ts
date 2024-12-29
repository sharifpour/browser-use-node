import type { DOMElementNode } from '../dom/types';

export interface ClickElementAction {
  index: number;
  element?: DOMElementNode;
}

export interface DoneAction {
  text: string;
}

export interface ExtractPageContentAction {
  value: 'text' | 'markdown';
}

export interface GoToUrlAction {
  url: string;
}

export interface InputTextAction {
  index: number;
  text: string;
  element?: DOMElementNode;
}

export interface OpenTabAction {
  url: string;
}

export interface ScrollAction {
  amount?: number;
}

export interface SearchGoogleAction {
  query: string;
}

export interface SendKeysAction {
  keys: string;
}

export interface SwitchTabAction {
  page_id: number;
}

export interface FileUploadAction {
  index: number;
  file_path: string;
  element?: DOMElementNode;
}

export interface DropdownAction {
  index: number;
  value: string;
  element?: DOMElementNode;
}

export interface HoverAction {
  index: number;
  element?: DOMElementNode;
}

export interface WaitAction {
  timeout: number;
  condition?: string;
}

export interface ScrollToTextAction {
  text: string;
  exact?: boolean;
}

export interface ExtractTableAction {
  index: number;
  format?: 'csv' | 'json';
}

export interface ScreenshotAction {
  full_page?: boolean;
  element_index?: number;
  path?: string;
}

export interface ClearInputAction {
  index: number;
  element?: DOMElementNode;
}

export interface RefreshAction {
  hard?: boolean;
}

export interface AcceptDialogAction {
  text?: string;
}

export interface DismissDialogAction {
  text?: string;
}

export interface SetViewportAction {
  width: number;
  height: number;
  device_scale_factor?: number;
  is_mobile?: boolean;
  has_touch?: boolean;
  is_landscape?: boolean;
}

export interface SetGeolocationAction {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface SetOfflineAction {
  offline: boolean;
}

export interface EmulateMediaAction {
  type: 'screen' | 'print' | 'null';
  color_scheme?: 'light' | 'dark' | 'no-preference';
  reduced_motion?: 'reduce' | 'no-preference';
}

export interface SetExtraHeadersAction {
  headers: Record<string, string>;
}

export interface SetCookiesAction {
  cookies: Array<{
    name: string;
    value: string;
    url?: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }>;
}

export interface DeleteCookiesAction {
  names?: string[];
  domain?: string;
  path?: string;
}

export interface ExecuteJavaScriptAction {
  script: string;
  args?: any[];
}

export interface WaitForSelectorAction {
  selector: string;
  timeout?: number;
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
}