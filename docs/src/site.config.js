export const site = {
  title: 'TechnoTUT Network',
  tagline: 'Powering live events with Media over IP.',
  url: 'https://network.technotut.net',
  navTitle: 'Network',
  logo: '/img/technotut_logo.svg',
  editUrl: 'https://github.com/TechnoTUT/Infra/tree/main/docs/',
  github: 'https://github.com/TechnoTUT/Infra/',
  // ヘッダーのタブ。href 指定はそのパス、それ以外は docs/content 直下のフォルダ名(= section id)
  sections: [
    { id: 'about', label: 'About', href: '/' },
    { id: 'network', label: 'Network' },
    { id: 'computing', label: 'Compute' },
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
