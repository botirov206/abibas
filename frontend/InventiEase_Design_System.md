# InventiEase Design System & Visual Guidelines

## 1. Global Design Tokens

### 1.1 Typography
**Font Family:** `General Sans` (Apply globally to the sans-serif font stack)

* **Title Text Hierarchy:**
    * H1: `32px` (Tailwind: `text-4xl`, `font-bold`)
    * H2: `28px` (Tailwind: `text-3xl`, `font-bold`)
    * H3: `24px` (Tailwind: `text-2xl`, `font-semibold`)
    * H4: `20px` (Tailwind: `text-xl`, `font-semibold`)
* **Body Text Hierarchy:**
    * Large/Lead: `18px` (Tailwind: `text-lg`)
    * Base: `16px` (Tailwind: `text-base`)
    * Small: `14px` (Tailwind: `text-sm`)
    * Caption/Micro: `12px` (Tailwind: `text-xs`)

### 1.2 Color Palette
* **Bold Black (Primary Dark):** `#090909` - Used for heavy text, active card backgrounds, and high-contrast UI elements.
* **Fresh Pineapple (Accent Primary):** `#EBF05B` - Used for primary action buttons, active state highlights, and attention-grabbing tags.
* **Neutral White (Surface):** `#FFFFFF` - Used for standard card backgrounds.
* **Latigo Bay (Accent Secondary):** `#409C9B` - Used for secondary highlights, success states, indoor map paths, and specific call-to-action buttons (like the mobile dock button).
* **Flintstone (Muted Base):** `#788596` - Used for secondary text, inactive icons, descriptions, and subtle UI borders.
* **App Background:** A very soft, warm off-white or gray gradient (e.g., `#F4F5F7` or `#F9F9FB`) to allow the stark white cards to pop off the canvas.

### 1.3 Border Radius & Shadows
* **Cards & Containers:** Highly rounded. Use `24px` to `32px` for main container cards (Tailwind: `rounded-3xl` or `rounded-[24px]`).
* **Inner Elements (Tags, Buttons):** Fully rounded pills (Tailwind: `rounded-full`) or medium-rounded interactive elements (`rounded-xl` or `12px`).
* **Shadows:** Extremely subtle, diffuse shadows. Avoid harsh drop shadows. Rely more on surface color differences and very soft, large-spread shadows (Tailwind: `shadow-sm` or `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`).

---

## 2. Core UI Components

### 2.1 Buttons & Controls
* **Primary Action Button:** Background `Fresh Pineapple`, Text `Bold Black`. Pill shape (`rounded-full`). Text should be `14px` or `16px` bold.
* **Secondary/Dark Button:** Background `Bold Black`, Text `Neutral White`. Used for active states in toggle groups (e.g., selecting between Daily, Weekly, or Monthly Rent).
* **Icon Buttons:** Circular. Often feature a white background with a subtle border or a light gray background, containing a `Flintstone` colored icon.
* **Segmented Controls / Category Filters:** Pill-shaped horizontal scrolling lists. The active item features a `Bold Black` background with white text. Inactive items are light gray or white with `Flintstone` text.

### 2.2 Cards
* **Inventory Item Card (Desktop/Tablet Grid):**
    * White background, `rounded-3xl`.
    * Padding: ~`16px` internal padding.
    * Image: Centered, taking up the top 40-50% of the card area.
    * Typography: Title (`16px`, Bold Black), sub-category tag (`12px`, Flintstone).
    * Action Row: Action icon buttons (e.g., an edit icon) and a prominent yellow "Update" button spanning the full width or floating at the bottom.
* **Pricing/Rent Interval Card:**
    * Square or slightly vertical aspect ratio.
    * Inactive State: White background, subtle gray border, Flintstone text.
    * Active State: `Bold Black` background, `Neutral White` text, with a `Fresh Pineapple` visual indicator (like a custom radio button).
* **Navigation/Indoor Map Card:**
    * Contains an indoor grid map layout (wireframe style).
    * The navigational path is highlighted using a thick `Latigo Bay` (teal) line.
    * The bottom section overlaps with a dark `Bold Black` card indicating the next step ("Turn left in 10 meters") and a `Fresh Pineapple` directional arrow.

### 2.3 Badges & Tags
* Small, pill-shaped components (`rounded-full`), `text-xs`.
* Used for locations (e.g., `📍 D3 - R6 - F2`), Categories (`Fresh Fruit`), or Status indicators (`🔴 65 days left`).
* Typically styled with a white background and a very subtle gray border, or a light gray background. Icons inside tags match the `Flintstone` color.

---

## 3. Layout Systems

### 3.1 Mobile View
* **Top Nav:** Minimalist header containing a hamburger menu, current context title, and User Avatar.
* **Content Area:** Employs horizontal scrolling for category filter pills at the top. The main vertical scroll uses large, edge-to-edge cards.
* **Floating Navigation Dock:** A floating, pill-shaped dock fixed at the bottom of the screen. It contains navigational icons (`Flintstone` colored, changing to `Bold Black` when active) and a prominent, elevated Primary Action button (e.g., a `Latigo Bay` colored "My Items" button that breaks the bounds of the dock).

### 3.2 Tablet/Desktop View (Database Management)
* **Sidebar/Header Layout:** A slim horizontal header with quick actions, or a collapsible left sidebar depending on the specific module.
* **Grid System:** Employs CSS Grid for inventory cards. Responsive mapping: 1 column on mobile, 2 columns on tablet, 3-4 columns on desktop. Grid gap is standard `24px` (Tailwind: `gap-6`).
* **Client Profile Summary Layout:** A two-pane layout. The left pane functions as a sticky profile summary card (Avatar, basic information, aggregate rent stats like "Total Rent" and "Total Items"). The right main area displays a CSS grid of rented inventory items associated with that specific client profile.

---

## 4. AI-Assisted Implementation Strategy

When utilizing an AI coding assistant to generate the React/Tailwind frontend, use this structured prompting sequence to achieve accurate results:

1.  **Context Loading:** Provide this entire `design.md` document as context or as a referenced file in your workspace.
2.  **Step 1: Foundational Layout Setup**
    * *Prompt:* "Create a responsive React layout shell using Tailwind CSS based on the design system provided. Set the global background to `#F9F9FB`. Implement a top navigation bar and a floating bottom dock tailored for mobile view. Ensure all typography utilizes the 'General Sans' font family."
3.  **Step 2: Atomic Component Generation**
    * *Prompt:* "Build a reusable `InventoryCard` component. It must accept props for `imageUrl`, `title`, `category`, `locationTag`, and `rentStatus`. Style it with `rounded-3xl`, a white background, and implement the 'Fresh Pineapple' color for the primary action button at the bottom of the card. Use the 'Flintstone' color for secondary text."
4.  **Step 3: View Assembly & Data Mapping**
    * *Prompt:* "Construct the 'Database Management' view. Implement a responsive CSS Grid that transitions from 1 column on mobile, to 2 on tablet, and 4 on desktop with a `gap-6`. Map over an array of mock warehouse data to render the `InventoryCard` components."
