# 🎨 Figma Design Brief: SaaS Fashion AI App

## 📋 Project Overview

**Project Name:** StyleMate - AI Fashion Stylist App  
**Platform:** React Native (iOS & Android)  
**Target Audience:** Gen Z fashion enthusiasts (18-28 years old) who want instant, personalized outfit recommendations  
**Design Goal:** Create a modern, intuitive, and visually stunning UI/UX that makes AI-powered fashion styling feel effortless and delightful

---

## 🎯 Core Value Proposition

**"Your personal AI stylist for every fashion decision"**

The app helps users:
- Get instant, personalized outfit recommendations powered by AI
- Manage their digital wardrobe with ease
- Discover their style through optional Pinterest integration
- Make confident fashion choices with AI-powered insights

---

## 🎨 Design System

### **Color Palette**

**Primary Colors:**
- **Primary:** `#6366F1` (Indigo) - Main brand color, CTAs, active states
- **Secondary:** `#8B5CF6` (Purple) - Accents, highlights
- **Accent:** `#F59E0B` (Amber) - Special actions, warnings

**Background Colors:**
- **Background:** `#0F0F23` (Dark blue-black) - Main app background
- **Background Secondary:** `#1E1E3F` (Dark blue-gray) - Cards, elevated surfaces
- **Background Card:** `rgba(255, 255, 255, 0.05)` - Glassmorphism cards
- **Background Glass:** `rgba(255, 255, 255, 0.1)` - Glass effects

**Text Colors:**
- **Text Primary:** `#FFFFFF` (Pure White) - Headings, primary text
- **Text Secondary:** `#E2E8F0` (Light gray) - Body text, descriptions
- **Text Tertiary:** `#94A3B8` (Medium gray) - Captions, hints
- **Text Muted:** `#64748B` (Dark gray) - Disabled states

**Status Colors:**
- **Success:** `#10B981` (Emerald) - Positive actions, confirmations
- **Warning:** `#F59E0B` (Amber) - Warnings, attention
- **Error:** `#EF4444` (Red) - Errors, destructive actions
- **Info:** `#3B82F6` (Blue) - Information, links

**Special Colors:**
- **Pinterest Brand:** `#E60023` - Pinterest integration elements
- **Like/Heart:** `#EC4899` (Pink) - Favorite actions
- **Border:** `rgba(255, 255, 255, 0.1)` - Subtle borders

### **Typography**

**Font Family:** System fonts (SF Pro on iOS, Roboto on Android)

**Type Scale:**
- **H1 (Display):** 32px, Bold, Line Height: 40px - Main screen titles
- **H2 (Headline):** 28px, Bold, Line Height: 36px - Section headers
- **H3 (Title):** 24px, SemiBold, Line Height: 32px - Card titles
- **Body Large:** 18px, Regular, Line Height: 26px - Important body text
- **Body:** 16px, Regular, Line Height: 24px - Standard body text
- **Body Small:** 14px, Regular, Line Height: 20px - Secondary text
- **Caption:** 12px, Regular, Line Height: 16px - Labels, hints
- **Button:** 16px, SemiBold - Button text

### **Spacing System**

Use 4px base unit:
- **XS:** 4px
- **SM:** 8px
- **MD:** 16px
- **LG:** 24px
- **XL:** 32px
- **XXL:** 48px

### **Border Radius**

- **Small:** 8px - Small buttons, chips
- **Medium:** 12px - Cards, inputs
- **Large:** 16px - Large cards, modals
- **XLarge:** 20px - Hero sections
- **Full:** 999px - Pills, badges

### **Shadows & Elevation**

- **Level 1:** Subtle elevation for cards
  - `shadowColor: #000000`
  - `shadowOffset: { width: 0, height: 2 }`
  - `shadowOpacity: 0.1`
  - `shadowRadius: 4`

- **Level 2:** Medium elevation for modals
  - `shadowOffset: { width: 0, height: 4 }`
  - `shadowOpacity: 0.15`
  - `shadowRadius: 8`

- **Level 3:** High elevation for floating elements
  - `shadowOffset: { width: 0, height: 8 }`
  - `shadowOpacity: 0.2`
  - `shadowRadius: 16`

### **Glassmorphism Effects**

- **Glass Card:** 
  - Background: `rgba(255, 255, 255, 0.05)`
  - Border: `rgba(255, 255, 255, 0.1)`
  - Backdrop blur: 20px
  - Subtle gradient overlay

---

## 📱 Screen-by-Screen Requirements

### **1. Home Screen (Dashboard)**

**Purpose:** Main entry point, quick access to all features

**Key Elements:**
- Personalized greeting with time-based message ("Good Morning", "Good Afternoon", "Good Evening")
- User's first name display
- Weather widget (temperature, icon) - top right
- Subtitle: "Your personal AI stylist for every fashion decision"

**Main Action Cards (Vertical Stack):**
1. **"Ask AI Stylist"** (Primary CTA - Indigo background)
   - Icon: Sparkles icon
   - Title: "Ask AI Stylist"
   - Subtitle: "Get personalized outfit advice and feedback"
   - Chevron indicator

2. **"Style Check"**
   - Icon: Camera icon
   - Title: "Style Check"
   - Subtitle: "Take a photo for instant styling feedback"
   - Chevron indicator

3. **"Find Similar Items"**
   - Icon: Search icon
   - Title: "Find Similar Items"
   - Subtitle: "Upload Pinterest image to find similar clothes"
   - Chevron indicator

4. **"Enhance with Pinterest"** (Optional feature)
   - Icon: Pinterest icon (brand color)
   - Title: "Enhance with Pinterest"
   - Subtitle: "Optional: Get even more personalized recommendations"
   - Chevron indicator
   - Subtle border or background tint to indicate optional nature

**Stats Section (Horizontal):**
- Two stat cards side by side:
  - "Items in Wardrobe" (count)
  - "Store Items Available" (count)
- Each card: Background card, centered text, large number, small label

**Design Notes:**
- Clean, spacious layout
- Primary action (AI Stylist) should stand out
- Optional features should be visually distinct but not intrusive
- Smooth scroll with proper spacing

---

### **2. AI Stylist Screen (StyleSwipe)**

**Purpose:** Core feature - swipe through AI-generated outfit recommendations

**Header Section:**
- Left side:
  - Title: "AI Stylist" (28px, bold)
  - Optional Pinterest badge (if Pinterest insights active):
    - Small pill: Pinterest icon + "Pinterest" text
    - Background: `#E60023` (Pinterest brand color)
    - White text
  - Subtitle: 
    - If Pinterest active: "Enhanced with your [aesthetic] Pinterest style"
    - If not: "Get personalized outfit advice"
  - Optional enhancement prompt (if Pinterest not active):
    - Small pill with Pinterest icon + "Enhance with Pinterest" + chevron
    - Subtle background tint, Pinterest brand color text
- Right side:
  - "Ask Stylist" button (chat icon + text)
  - Stats row (horizontal):
    - Heart icon + favorites count
    - Flash icon + streak count
    - Trending icon + total swipes count

**Context Chips (Filter Bar):**
- Two rows:
  - **Occasion:** Casual, Professional (labeled "work"), Date, Party
  - **Weather:** Cold, Mild, Warm, Hot
  - Auto-weather pill (if location enabled): Thermometer icon + temperature
- Selected state: Indigo background, white text
- Unselected: Card background, gray text

**Main Content Area:**
- Large swipeable card (Tinder-style):
  - Outfit image/visualization
  - Outfit details overlay
  - Swipe gestures (left = pass, right = save)
  - Item swap functionality
- Loading state: Spinner + "Loading outfits..."
- Error state: Alert icon + error message + "Try Again" button

**Progress Indicator:**
- Text: "[current] of [total]"
- Progress bar: Thin bar with fill percentage

**Swipe Instructions (Bottom):**
- Two icons with labels:
  - Close circle icon + "Swipe Left to Pass"
  - Heart icon + "Swipe Right to Save"

**Undo Banner (Floating):**
- Appears after swipe action
- "Swipe [saved/dismissed]" text
- "Undo" button
- Auto-dismisses after 2.5 seconds

**Design Notes:**
- Card should feel premium and swipeable
- Smooth animations for swipe gestures
- Clear visual feedback for actions
- Pinterest integration should feel seamless, not forced

---

### **3. Wardrobe Screen**

**Purpose:** Manage user's clothing items

**Header:**
- Title: "Wardrobe" (left)
- Action icons (right, horizontal):
  - Search icon (toggle search bar)
  - Camera icon (open camera)
  - Images icon (open gallery)
  - Selection mode icon (toggle multi-select)

**Category Tabs (Horizontal Scroll):**
- Pills: All, Tops, Bottoms, Shoes, Accessories, Outerwear
- Each with icon + label
- Active state: Indigo background
- Inactive: Card background

**Search Bar (Conditional):**
- Full-width input with search icon
- Placeholder: "Search wardrobe..."
- Clear button (X) when text entered

**Selection Mode Bar (Conditional):**
- Shows when selection mode active
- Left: "[X] selected" text
- Right: Delete button (trash icon) + "Create Outfit" button

**Content Area:**
- **Grid Layout (2 columns):**
  - Each item card:
    - Square image (aspect ratio 1:1)
    - Item name (bold, 14px)
    - Brand name (secondary text, 12px)
    - Subcategory (if available, italic, 10px)
  - Selected state: Indigo border (4px), subtle glow
- **Empty State:**
  - Large icon (shirt outline)
  - "Your wardrobe is empty" text
  - "Add items using the camera or gallery" subtitle

**Category Sections (When "All" selected):**
- Grouped by category with section headers
- Each section: Icon + Category name + count

**Add Item Modal:**
- Full-screen modal
- Image preview at top
- Form fields:
  - Name, Brand, Category, Color, Size, etc.
- Save/Cancel buttons

**Design Notes:**
- Grid should be clean and scannable
- Images are critical - ensure good aspect ratios
- Selection mode should be intuitive
- Empty states should be encouraging

---

### **4. Pinterest Style Screen**

**Purpose:** Optional Pinterest board analysis for style enhancement

**Header:**
- Title: "🎨 Enhance Your Style" (28px, bold)
- Subtitle: "Optionally connect your Pinterest boards to get even more personalized outfit recommendations that match your actual style preferences"
- Emphasis on "optional" throughout

**Pinterest Board Analyzer Component:**
- Input field for Pinterest board URL
- "Analyze" button
- Loading state during analysis
- Results display when complete

**Analyzed Boards Section (If boards exist):**
- Section title: "Your Analyzed Boards"
- Card for each board:
  - Board name (bold)
  - Stats: Pin count + confidence percentage
  - Style label: "Style: [aesthetic]"
  - Color palette preview (4 color dots)
  - Analysis date + processing time
  - Delete button (trash icon)

**Empty State (If no boards):**
- Large Pinterest icon (outline, gray)
- "Ready to Enhance Your Style?" title
- "Your AI stylist already works great! Adding Pinterest boards will make recommendations even more personalized..." subtitle

**How It Works Section:**
- Section title: "How It Works"
- Three step cards:
  1. "Paste Your Board URL" - Copy and paste any Pinterest board URL
  2. "AI Analysis" - AI analyzes pins for color, style, aesthetic
  3. "Get Recommendations" - Receive personalized outfit recommendations

**Benefits Section:**
- Section title: "Why Add Pinterest? (Optional)"
- Three benefit cards:
  - Sparkles icon: "Discover Your Style"
  - Shirt icon: "Personalized Outfits"
  - Trending icon: "Style Evolution"

**Design Notes:**
- Emphasize optional nature throughout
- Make benefits clear but not pushy
- Pinterest brand color (`#E60023`) for Pinterest-specific elements
- Clean, educational layout

---

### **5. Profile Screen**

**Purpose:** User profile, preferences, achievements, settings

**Header:**
- User avatar (circular)
- Display name
- Email (secondary text)

**Stats Section:**
- Grid of stat cards:
  - Items in wardrobe
  - Outfits created
  - Style score
  - Streak days

**Sections:**
- **Preferences:**
  - Style profile
  - Favorite colors
  - Brand preferences
- **Achievements:**
  - Badge grid
  - Progress indicators
- **Settings:**
  - Account settings
  - Notifications
  - Privacy
  - Logout

**Design Notes:**
- Personal and engaging
- Achievement badges should be visually appealing
- Clear navigation to settings

---

### **6. Style Check Screen**

**Purpose:** AI-powered style feedback on user photos

**Camera Interface:**
- Camera preview (full screen)
- Capture button (large, circular, bottom center)
- Gallery button (bottom left)
- Flash toggle (top)

**Results Display:**
- Uploaded/ captured image
- AI analysis results:
  - Style score
  - Color analysis
  - Fit feedback
  - Improvement suggestions
- Action buttons:
  - "Try Again"
  - "Save to Wardrobe"
  - "Get Outfit Suggestions"

**Design Notes:**
- Camera should feel native and responsive
- Results should be clear and actionable
- Visual feedback is important

---

## 🎯 User Experience Principles

### **1. Instant Gratification**
- No loading screens longer than 2 seconds
- Immediate feedback on all actions
- Haptic feedback for key interactions
- Smooth 60fps animations

### **2. Clarity & Simplicity**
- One primary action per screen
- Clear visual hierarchy
- Minimal cognitive load
- Intuitive navigation

### **3. Delight & Engagement**
- Smooth animations and transitions
- Micro-interactions that feel responsive
- Visual feedback for all user actions
- Gamification elements (streaks, achievements)

### **4. Accessibility**
- High contrast ratios (WCAG AA minimum)
- Touch targets minimum 44x44px
- Readable font sizes (minimum 14px)
- Color-blind friendly palette

### **5. Optional Features**
- Pinterest integration should feel optional, not required
- Clear visual distinction between core and optional features
- No blocking or error states for optional features
- Enhancement messaging, not requirement messaging

---

## 🔧 Technical Constraints

### **React Native Considerations:**
- Use system fonts (SF Pro iOS, Roboto Android)
- Touch targets: Minimum 44x44px
- Safe area handling for notches/status bars
- Bottom tab bar: 60px height
- Status bar: Dark content on light backgrounds, light content on dark

### **Performance:**
- Optimize images (WebP format, proper sizing)
- Lazy load images in lists
- Smooth scroll performance (60fps)
- Efficient animations (use native driver)

### **Platform Differences:**
- iOS: More rounded corners, softer shadows
- Android: Material Design elevation, sharper shadows
- Navigation: Stack navigation for modals, tab navigation for main screens

---

## 🎨 Design Style Guidelines

### **Overall Aesthetic:**
- **Modern & Minimal:** Clean layouts with plenty of white space
- **Dark Theme:** Sophisticated dark backgrounds with glassmorphism
- **Premium Feel:** High-quality visuals, smooth animations
- **Gen Z Appeal:** Bold typography, vibrant accents, emoji usage where appropriate

### **Component Patterns:**

**Cards:**
- Rounded corners (12-16px)
- Subtle elevation/shadow
- Glassmorphism effect (semi-transparent with blur)
- Padding: 16-20px

**Buttons:**
- Primary: Indigo background, white text, 16px padding
- Secondary: Transparent with border, 16px padding
- Text buttons: Underlined or icon-only
- Minimum height: 44px

**Inputs:**
- Rounded corners (12px)
- Card background with border
- Clear focus states
- Placeholder text in secondary color

**Badges/Pills:**
- Rounded corners (20px full pill)
- Small padding (8px horizontal, 4px vertical)
- Icon + text combinations

**Icons:**
- Ionicons library (outline style default, filled when active)
- Size: 20-24px for standard, 28-32px for emphasis
- Color: Primary for active, Secondary for inactive

---

## 📐 Layout Specifications

### **Screen Dimensions:**
- Design for: iPhone 14 Pro (390x844) and Android standard (360x800)
- Use flexible layouts (Flexbox)
- Safe area insets: Top 44px (iOS), Bottom 34px (notch devices)

### **Grid System:**
- 2-column grid for wardrobe items
- 3-column grid for achievements/badges
- Full-width for cards and main content

### **Spacing:**
- Screen padding: 20px horizontal
- Section spacing: 24px vertical
- Card spacing: 12px
- Element spacing: 8-16px

---

## 🚀 Animation & Interaction

### **Transitions:**
- Screen transitions: 300ms ease-in-out
- Modal presentations: Slide up from bottom
- Card interactions: Scale 0.98 on press

### **Micro-interactions:**
- Button press: Scale down 0.95
- Swipe gestures: Smooth follow with rotation
- Loading states: Smooth spinners, skeleton screens
- Success states: Checkmark animation, haptic feedback

### **Haptic Feedback:**
- Light impact: Swipe actions, button presses
- Success: Save actions, achievements
- Error: Failed actions, invalid inputs

---

## 📋 Deliverables Checklist

### **Figma File Structure:**
- [ ] Design System (Colors, Typography, Components)
- [ ] Screen Designs (All 6+ screens)
- [ ] Component Library (Reusable components)
- [ ] Icon Set (Custom icons if needed)
- [ ] Empty States (All variations)
- [ ] Loading States (All variations)
- [ ] Error States (All variations)
- [ ] Responsive Variations (Different screen sizes)

### **Design Assets:**
- [ ] Color palette with hex codes
- [ ] Typography scale
- [ ] Spacing system
- [ ] Component specifications
- [ ] Animation guidelines
- [ ] Icon library

### **Documentation:**
- [ ] Design system documentation
- [ ] Component usage guidelines
- [ ] Interaction patterns
- [ ] Accessibility notes

---

## 🎯 Success Criteria

The design should:
1. ✅ Feel modern and premium
2. ✅ Be intuitive for Gen Z users
3. ✅ Clearly communicate optional vs. required features
4. ✅ Provide excellent visual hierarchy
5. ✅ Support smooth, delightful interactions
6. ✅ Work beautifully on both iOS and Android
7. ✅ Be accessible to all users
8. ✅ Load quickly and feel responsive

---

## 💡 Additional Notes

### **Brand Personality:**
- **Friendly & Approachable:** Not intimidating, welcoming to all fashion levels
- **Smart & Helpful:** AI feels like a helpful friend, not a robot
- **Confident & Empowering:** Helps users feel good about their choices
- **Modern & Trendy:** Stays current with fashion trends

### **Competitive Analysis:**
- **Pinterest:** Inspiration and discovery
- **TikTok:** Swipe interactions, instant gratification
- **Instagram:** Visual-first, social validation
- **Stitch Fix:** Personalized recommendations

### **User Journey:**
1. **Onboarding:** Quick, friendly, sets expectations
2. **First Use:** Immediate value, no learning curve
3. **Regular Use:** Fast, efficient, delightful
4. **Power User:** Advanced features, personalization

---

## 📞 Questions or Clarifications?

If you need any clarification on:
- Feature functionality
- User flows
- Technical constraints
- Brand guidelines
- Or anything else!

Please reach out before starting the design work.

---

**Thank you for creating an amazing design that will help users feel confident and stylish! 🎨✨**

