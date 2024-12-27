import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'browser-use-node',
  tagline: 'Browser automation powered by LLMs in JavaScript/TypeScript',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://dankovk.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/browser-use-node/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'dankovk',
  projectName: 'browser-use-node',
  trailingSlash: false,

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/dankovk/browser-use-node/tree/main/docs/',
          routeBasePath: '/',
          include: ['**/*.md', '**/*.mdx', 'api/**/*'],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        entryPoints: ['../src/index.ts'],
        tsconfig: '../tsconfig.json',
        out: 'api',
        sidebar: {
          fullNames: true,
          position: 4,
        },
        plugin: ['typedoc-plugin-markdown'],
        readme: 'none',
        excludePrivate: false,
        excludeProtected: false,
        excludeExternals: false,
        excludeInternal: false,
        hideGenerator: false,
        outputFileStrategy: 'modules',
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'browser-use-node',
      logo: {
        alt: 'browser-use Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/',
          position: 'left',
          label: 'Getting Started',
        },
        {
          to: '/guides',
          position: 'left',
          label: 'Guides',
        },
        {
          to: '/api/globals',
          position: 'left',
          label: 'API Reference',
        },
        {
          to: '/contributing',
          position: 'left',
          label: 'Contributing',
        },
        {
          href: 'https://github.com/dankovk/browser-use-node',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/',
            },
            {
              label: 'API Reference',
              to: '/api/globals',
            },
          ],
        },
        {
          title: 'Project',
          items: [
            {
              label: 'Contributing',
              to: '/contributing',
            },
            {
              label: 'Code of Conduct',
              to: '/code-of-conduct',
            },
            {
              label: 'Security',
              to: '/security',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/dankovk/browser-use-node',
            },
            {
              label: 'Issues',
              href: 'https://github.com/dankovk/browser-use-node/issues',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} browser-use-node. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.vsDark,
      darkTheme: prismThemes.vsDark,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
