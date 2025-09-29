// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'TechnoTUT NOC',
  tagline: 'TechnoTUT Network Operation Center Team',
  favicon: 'img/logo.png',

  // Set the production url of your site here
  url: 'https://noc.technotut.net',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'TechnoTUT', // Usually your GitHub org/user name.
  projectName: 'Infra', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/TechnoTUT/Infra/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/rack.jpg',
      navbar: {
        title: 'NOC',
        logo: {
          alt: 'TechnoTUT Logo',
          src: 'img/technotut_logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'network',
            position: 'left',
            label: 'Network',
          },
          {
            type: 'docSidebar',
            sidebarId: 'computing',
            position: 'left',
            label: 'Computing',
          },
          {
            type: 'docSidebar',
            sidebarId: 'service',
            position: 'left',
            label: 'Service',
          },
          {
            type: 'docSidebar',
            sidebarId: 'web',
            position: 'left',
            label: 'Web',
          },
          {
            href: 'https://github.com/TechnoTUT/Infrastructure/',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Community',
            items: [
              {
                label: 'Home',
                href: 'https://technotut.net',
              },
              {
                label: 'Blog',
                href: 'https://blog.technotut.net',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/toyohashitechno',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/TechnoTUT',
              },
              {
                label: 'Instagram',
                href: 'https://instagram.com/tut_technotut',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} TechnoTUT. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
