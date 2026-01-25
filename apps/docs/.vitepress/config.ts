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
      { text: 'Roadmap', link: '/tokenomics/' }
    ],

    sidebar: {
      '/platform/': [
        {
          text: 'Platform',
          items: [
            { text: 'Overview', link: '/platform/' },
            { text: 'For Creators', link: '/platform/creators' },
            { text: 'For Learners', link: '/platform/learners' },
            { text: 'Creator Registration', link: '/platform/staking' },
            { text: 'Fees', link: '/platform/fees' }
          ]
        }
      ],
      '/tokenomics/': [
        {
          text: 'Roadmap & Token',
          items: [
            { text: 'Roadmap', link: '/tokenomics/' },
            { text: 'Token Utility (Planned)', link: '/tokenomics/utility' },
            { text: 'Distribution (Planned)', link: '/tokenomics/distribution' },
            { text: 'Value Accrual (Planned)', link: '/tokenomics/value-accrual' }
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
      copyright: '© 2025 Skola'
    }
  }
})
