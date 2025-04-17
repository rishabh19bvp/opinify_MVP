# Opinify Design System - Core Principles

## Overview
This document outlines the fundamental principles and guidelines that form the foundation of the Opinify design system.

## Table of Contents
1. [Core Principles](#core-principles)
2. [Visual Perception Laws](#visual-perception)
3. [Platform Guidelines](#platform-guidelines)

## Core Principles

### Universal Foundations
- **Clarity**: Purposeful design, clear hierarchy, focused interactions
- **Consistency**: Unified patterns, consistent language, visual harmony
- **Adaptability**: Responsive layouts, dark/light modes, accessibility
- **Delight**: Purposeful animations, quality haptics, polished details

## Visual Perception
Based on [Law of Prägnanz](https://lawsofux.com/law-of-prägnanz/) and [Law of Similarity](https://lawsofux.com/law-of-similarity/):

| Principle          | Implementation                | Example                         |
|-------------------|-------------------------------|--------------------------------|
| Proximity         | Group related items visually  | Navigation menu items           |
| Similarity        | Use consistent styles         | Action buttons, form fields     |
| Common Region     | Use containers for grouping   | Card components, list items     |
| Continuity        | Align elements meaningfully   | Form layouts, grid systems      |
| Closure           | Complete familiar patterns    | Loading spinners, progress bars |

## Platform Guidelines
Based on [Jakob's Law](https://lawsofux.com/jakobs-law/) and [Mental Models](https://lawsofux.com/mental-model/):

| Principle       | iOS Implementation          | Android Implementation           | UX Rationale                    |
|-----------------|-----------------------------|----------------------------------|--------------------------------|
| Navigation      | Tab bar with SF Symbols     | Bottom navigation with material icons | Familiar system patterns        |
| Typography      | SF Pro Text (17pt body)     | Roboto (14sp body)              | Platform reading comfort        |
| Color System    | Semantic colors             | Material palette                 | Expected color meanings         |
| Motion          | Smooth transitions (300ms)  | Material motion (250ms)          | Natural feeling animations      |
| Haptics         | Taptic Engine feedback      | Vibration patterns               | Physical response expectations  |

## References
- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines)
- [Material Design](https://material.io)
- [Laws of UX](https://lawsofux.com)
