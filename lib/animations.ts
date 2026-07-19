import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger)

/**
 * Animate an element with GSAP
 */
export const animateElement = (
  target: gsap.TweenTarget,
  vars: gsap.TweenVars,
) => {
  return gsap.to(target, vars)
}

/**
 * Create a scroll-triggered animation
 */
export const createScrollAnimation = (
  trigger: gsap.TweenTarget,
  animation: gsap.TweenVars,
  scrollTriggerConfig?: Partial<ScrollTrigger.Vars>,
) => {
  return gsap.to(trigger, {
    scrollTrigger: {
      trigger: trigger as gsap.DOMTarget,
      start: "top center",
      end: "bottom center",
      ...scrollTriggerConfig,
    } as ScrollTrigger.Vars,
    ...animation,
  })
}

/**
 * Create a stagger animation for multiple elements
 */
export const staggerAnimation = (
  targets: gsap.TweenTarget,
  vars: gsap.TweenVars,
) => {
  return gsap.to(targets, {
    stagger: 0.2,
    ...vars,
  })
}

/**
 * Create a timeline for complex animations
 */
export const createTimeline = () => {
  return gsap.timeline()
}

/**
 * Kill all animations
 */
export const killAllAnimations = () => {
  gsap.killTweensOf("*")
}

/**
 * Refresh ScrollTrigger (useful after dynamic content)
 */
export const refreshScrollTrigger = () => {
  ScrollTrigger.refresh()
}
