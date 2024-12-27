import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Guides',
      link: {
        type: 'doc',
        id: 'guides/index',
      },
      items: [
        'guides/index',
        'guides/installation',
        'guides/basic-browser-control',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      link: {
        type: 'doc',
        id: 'api/globals',
      },
      items: [
        'api/globals',
        {
          type: 'category',
          label: 'Classes',
          items: [
            'api/classes/Agent',
            'api/classes/Browser',
            'api/classes/BrowserContext',
            'api/classes/Controller',
            'api/classes/DOMObserver',
            'api/classes/DOMService',
            'api/classes/Registry'
          ],
        },
        {
          type: 'category',
          label: 'Interfaces',
          items: [
            'api/interfaces/AgentConfig',
            'api/interfaces/BrowserConfig',
            'api/interfaces/DOMState',
            'api/interfaces/ElementContext'
          ],
        },
        {
          type: 'category',
          label: 'Types',
          items: [
            'api/type-aliases/ConfigFile',
            'api/type-aliases/PageEventHandler',
            'api/type-aliases/PageEventType'
          ],
        }
      ],
    },
    {
      type: 'category',
      label: 'Project',
      items: [
        'contributing',
        'code-of-conduct',
        'security',
        'port-diff'
      ],
    },
  ],
};

export default sidebars;
