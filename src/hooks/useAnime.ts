import {gsap} from 'gsap'
export const useAnime = () => {
  
  const fadeUnFold = (el: any, done: any) => {
    gsap.to(el, {
      duration: 1,
      maxHeight:0,
      ease: 'elastic.out(1, 0.5)',
      onComplete: done,
    })
  }
  const fadeFold = (el: any, done: any) => {
    gsap.to(el, {
      duration: 1,
      maxHeight:2000,
      ease: 'elastic.out(1, 0.5)',
      onComplete: done,
    })
  }
  
  return {
    fadeUnFold,
    fadeFold,
  }
}
