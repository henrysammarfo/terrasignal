

# TerraSignal — Hero Section

## What We're Building
A minimalist, high-end landing page hero section for TerraSignal with cinematic video background, premium typography, and smooth entrance animations.

## Background Layer
- Full-screen background video (vertically flipped with `scaleY(-1)`, `object-cover`)
- White gradient overlay blending the video into the page background (from transparent at ~26% to solid white at ~67%)

## Content Layout
- Centered container, `max-w-[1200px]`, with **290px top padding** for an editorial spacious feel
- 32px vertical gap between content blocks

## Typography
- **Main heading**: "Simple [management] for your remote team" in **Geist** font, medium weight, 80px, tracking `-0.04em`
- The word **"management"** styled in **Instrument Serif** italic at 100px for contrast
- **Description text**: Geist, 18px, 80% opacity, slate color `#373a46`, max-width 554px
- Branding adapted to TerraSignal's commodity intelligence positioning

## Interactive Components
- **Email input bar**: Rounded (40px), `bg-[#fcfcfc]`, thin border, soft box shadow (`0px 10px 40px 5px rgba(194,194,194,0.25)`)
- **CTA button** ("Create Free Account"): Dark multi-layered gradient with complex inner shadow for a high-gloss tactile effect
- **Social proof badge**: "1,020+ Reviews" with star/brand icons row beneath the input

## Animations (Motion library)
- Staggered **fade + slide up** entrance for heading, description, and email input block
- Smooth, sequential reveal for a polished first impression

## Fonts
- Import **Geist** and **Instrument Serif** via Google Fonts

## Technical Details
- Install `motion` (formerly Framer Motion) for animations
- Single `HeroSection` component rendered on the Index page
- All exact CSS specs (shadows, gradients, spacing) applied as specified

