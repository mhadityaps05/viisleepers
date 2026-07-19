# Animation & Scroll Setup

This project is configured with GSAP and the ITC Benguiat Std font for smooth animations and typographic styling.

## GSAP (GreenSock Animation Platform)

GSAP utilities are available in `lib/animations.ts`. Available functions:

- `animateElement()` - Basic GSAP animation
- `createScrollAnimation()` - Scroll-triggered animations using ScrollTrigger
- `staggerAnimation()` - Stagger multiple elements
- `createTimeline()` - Create complex animation timelines
- `killAllAnimations()` - Stop all active animations
- `refreshScrollTrigger()` - Refresh scroll calculations

### Example Usage:

```typescript
import { animateElement, createScrollAnimation } from "@/lib/animations"

// Simple animation
animateElement(".element", {
  duration: 1,
  opacity: 1,
  y: 0,
})

// Scroll-triggered animation
createScrollAnimation(
  ".scroll-element",
  {
    opacity: 1,
    duration: 1,
  },
  {
    start: "top 80%",
    end: "bottom 20%",
  },
)
```

## Smooth Scrolling

Lenis has been removed from this project. If you'd like global smooth scrolling again, reinstall `lenis` or add another smooth-scroll library and initialize it in a client component.

## ITC Benguiat Std Font

The font is configured in `globals.css` with CSS variable `--font-benguiat`.

### Font Files Required

Add font files to `public/fonts/`:

- `itc-benguiat-std.woff2` (400 weight)
- `itc-benguiat-std.woff` (400 weight)
- `itc-benguiat-std.ttf` (400 weight)
- `itc-benguiat-std-bold.woff2` (700 weight)
- `itc-benguiat-std-bold.woff` (700 weight)
- `itc-benguiat-std-bold.ttf` (700 weight)

### Using the Font

In Tailwind CSS:

```html
<h1 class="font-benguiat">Heading with ITC Benguiat</h1>
```

Or in CSS:

```css
.heading {
  font-family: var(--font-benguiat);
}
```

## Installation Status

- ✅ GSAP - Installed
- ⚠️ Lenis - Removed
- ✅ Font configuration - Ready
- ⏳ Font files - **Awaiting upload to `public/fonts/`**

## Next Steps

1. Obtain the ITC Benguiat Std font files (.woff2, .woff, .ttf)
2. Place them in the `public/fonts/` directory
3. Start using GSAP animations.
4. (Optional) Add a smooth-scroll library if you want global smooth scrolling.
