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
- **Aesthetic-Usability**: Visually pleasing designs are perceived as more usable (see 02-ux-laws.md)
- **Goal-Gradient**: Users are more motivated as they approach task completion (see 02-ux-laws.md)
- **Adaptability**: Responsive layouts, dark/light modes, accessibility
- **Efficiency**: Minimize interaction time and distance (Fitts's Law)
- **Delight**: Purposeful animations, quality haptics, polished details

> For detailed explanations of foundational and advanced UX laws, see [02-ux-laws.md](./02-ux-laws.md).

## Laws of UI (UILaws.com)
The following foundational UI laws are essential for creating intuitive and effective interfaces:

- **Symmetry**: Symmetrical elements are perceived as unified and harmonious.
- **Rule of Thirds**: Dividing layouts into thirds (3x3 grid) and aligning key elements on these lines creates balance.
- **White Space**: Adequate spacing improves readability, focus, and visual appeal.
- **Color Theory**: Color choices evoke emotions and associations; harmonious palettes enhance design.
- **Typography Hierarchy**: Clear text size and style hierarchy guides users and improves readability.
- **Consistency**: Uniformity in design elements boosts usability and aesthetics.
- **Proximity**: Related elements should be grouped closely to signal their connection.
- **Contrast**: Distinct elements stand out and attract user attention.
- **Closure**: Users perceive complete shapes even if parts are missing.
- **Continuity**: Elements arranged in a line or curve are seen as related.
- **Fitts’s Law**: The time to acquire a target depends on its size and distance; make important targets large and accessible.
- **Hick’s Law**: Decision time increases with the number and complexity of choices; simplify options.
- **Jakob's Law**: Users expect your product to work like others they use; follow familiar conventions.

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
| Touch Targets   | Hit areas ≥48×48pt, thumb-friendly placement | Hit areas ≥48dp, thumb zone awareness | Improves tap accuracy & reduces errors |

## References
- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines)
- [Material Design](https://material.io)
- [Laws of UX](https://lawsofux.com)
