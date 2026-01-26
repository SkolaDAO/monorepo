import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Skola',
  description: 'Decentralized Course Marketplace',
  
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }]
  ],

  themeConfig: {
    logo: '/logo.png',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Platform', link: '/platform/' },
      { text: 'Roadmap', link: '/tokenomics/' },
      { text: 'Launch App', link: 'https://app.skola.academy' }
    ],

    sidebar: {
      '/platform/': [
        {
          text: 'Platform',
          items: [
            { text: 'Overview', link: '/platform/' },
            { text: 'For Creators', link: '/platform/creators' },
            { text: 'For Learners', link: '/platform/learners' },
            { text: 'Fees', link: '/platform/fees' }
          ]
        }
      ],
      '/tokenomics/': [
        {
          text: 'Roadmap',
          items: [
            { text: 'Roadmap & Future', link: '/tokenomics/' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/SkolaDAO' },
      { icon: 'twitter', link: 'https://x.com/skoladao' },
      { icon: 'discord', link: 'https://discord.gg/5qec9N8xmY' }
    ],

    footer: {
      message: 'Built for creators, by creators.',
      copyright: '© 2026 Skola'
    }
  }
})
