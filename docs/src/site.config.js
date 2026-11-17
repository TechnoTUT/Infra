export const site = {
  title: 'TechnoTUT Network',
  tagline: 'TechnoTUT Network',
  url: 'https://network.technotut.net',
  navTitle: 'Network',
  logo: '/img/technotut_logo.svg',
  editUrl: 'https://github.com/TechnoTUT/Infra/tree/main/docs/',
  github: 'https://github.com/TechnoTUT/Infra/',
  // docs/content 直下のフォルダ名 (groups 指定時は複数フォルダを1タブにまとめる)
  sections: [
    {
      id: 'nw-compute',
      label: 'NW/Compute',
      groups: [
        { folder: 'network', label: 'Network' },
        { folder: 'computing', label: 'Compute' },
      ],
    },
    { id: 'service', label: 'Service' },
  ],
  footerLinks: [
    { label: 'Home', href: 'https://technotut.net' },
    { label: 'Blog', href: 'https://blog.technotut.net' },
    { label: 'Twitter', href: 'https://twitter.com/toyohashitechno' },
    { label: 'GitHub', href: 'https://github.com/TechnoTUT' },
    { label: 'Instagram', href: 'https://instagram.com/tut_technotut' },
  ],
};
