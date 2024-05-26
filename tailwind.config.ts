import type { Config } from 'tailwindcss'
import  { addDynamicIconSelectors }  from'@iconify/tailwind'
export default {
  content: [
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  plugins: [addDynamicIconSelectors()],
  theme: {
   
    extend: {
      animation:{
        'swing-large':"swing-large 0.2s ",
        'swing-small':" swing-small 0.2s"
      },
      colors:{
        primary:'#4e95ff'
      },
    },
    keyframes:{
      'swing-small':{
        '20%':{transform:'rotate(8deg)  scale(1.05)',},
        '40%':{transform:'rotate(0) scale(1.1)',}
      },
      'swing-large':{
        '20%':{transform:'rotate(50deg)  scale(1.05)',},
        '40%':{transform:'rotate(0) scale(1.1)',}
      }
    
    },
   
  },

} satisfies Config

