Here is your **fully rewritten Frontend Guidelines document**, cleaned, consistent, and updated with your **new color system \+ typography \+ removed redundancies**.

---

# **FRONTEND GUIDELINES — Booqse (FINAL)**

---

## **1\. Brand Foundation**

### **Product Essence**

A calm, intelligent space to understand your reading and yourself.

---

### **Core UX Principles**

* One primary action per screen  
* Progressive disclosure (no overload)  
* Calm, distraction-free experience  
* Guide \> expose  
  ---

  ## **2\. Color System**

  ### **Core Principle**

The interface uses a **neutral base with expressive but controlled accents**.

The goal is to remain calm and readable while introducing a distinct, memorable identity.

* Neutrals → clarity & calm  
* Burgundy → primary identity & actions  
* Light blue → secondary support  
* Orange / green → functional only  
  ---

  ### **Neutrals (Foundation)**

* Background: `#F9EEE5`  
* Surface: `#FFFFFF`  
* Subtle surface: `#F4EFEA`  
* Border: `#E3DED8`

Text:

* Primary: `#1A1A1A`  
* Secondary: `#5F5F5F`  
  ---

  ### **Primary Accent — Burgundy**

* Primary: `#6B2137`  
* Hover: `#541A2B`  
* Active: `#3E1320`  
* Soft background: `#F6E9EC`

**Usage:**

* primary buttons (CTA)  
* key highlights  
* important actions  
  ---

  ### **Secondary Accent — Light Blue**

* Primary: `#B7D8FF`  
* Hover: `#9FC6F0`  
* Soft background: `#EEF6FF`

**Usage:**

* secondary actions  
* informational UI elements  
* recommendation highlights  
  ---

  ### **Accent — Soft Pink (Limited)**

* `#FFB7B7`

**Usage:**

* tags  
* subtle emotional highlights  
  ---

  ### **Functional Colors**

  #### **Error (Orange)**

* Primary: `#FC4D17`  
* Hover: `#E04314`  
* Background: `#FFEDE6`

  #### **Success (Green)**

* Primary: `#5FA86E`  
* Background: `#EAF6ED`

  #### **Warning (Optional)**

* `#D0C360`  
  ---

  ### **Usage Rules (Critical)**

* 80% neutrals  
* 15% burgundy  
* 5% blue  
  ---

  ### **DO**

* use burgundy for primary actions  
* keep UI mostly neutral  
* use accent colors sparingly  
  ---

  ### **DON’T**

* mix multiple accent colors in one component  
* use functional colors outside their purpose  
* overload screens with color  
  ---

  ### **Accessibility**

* All text must meet WCAG AA contrast  
* Do not rely on color alone for meaning  
* Ensure readability across all states  
  ---

  ## **3\. Typography System**

  ### **Font System**

* **Primary (UI):** Clash Grotesque  
* **Secondary (Headings only):** Sentient Regular  
  ---

  ### **Font Roles**

  #### **Sentient Light**

Used **only for headings**.

Use for:

* H1 (main titles)  
* H2 (major sections)

Do NOT use for:

* body text  
* buttons  
* inputs  
* navigation  
  ---

  #### **Clash Grotesque**

Used for all interface and readable content.

---

### **Weight System (Strict)**

#### **Clash Grotesque**

| Use case | Weight |
| ----- | ----- |
| Body text | 400 |
| Section titles | 500 |
| Secondary text | 300 |
| Buttons | 400 |

---

#### **Sentient**

| Use case | Weight |
| ----- | ----- |
| Headings only | Regular |

---

### **Type Scale**

* H1 → 40–48px  
* H2 → 28–32px  
* Section titles → 20–24px  
* Body → 16px  
* Small → 14px  
  ---

  ### **Line Height**

* Body → 1.5  
* Headings → 1.2–1.3  
  ---

  ### **Rules**

* Serif is restricted to headings only  
* No random weight usage  
* Maintain clear hierarchy  
* Keep layout airy  
  ---

  ### **Design Intent**

Typography combines modern clarity with subtle editorial depth, reinforcing a calm and thoughtful reading experience.

---

## **4\. Layout & Spacing**

### **Layout**

* Max width: 1100–1200px  
* Centered content  
* Vertical stacking (avoid dense grids)  
  ---

  ### **Spacing System**

Use consistent scale:

* 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64  
    
  ---

  ### **Principles**

* Prefer whitespace over separators  
* Avoid cramped UI  
* Every section must “breathe”  
  ---

  ## **5\. Navigation**

  ### **Mobile**

* Bottom navigation  
* Primary items:  
  * Home  
  * Stats  
  * Recommendations  
  * Profile  
* Persistent or floating **“Log session” CTA**  
  ---

  ### **Desktop**

* Top navigation  
* Max 4–5 items  
* Clean, minimal  
  ---

  ## **6\. Component Guidelines**

  ### **Buttons**

* Radius: 8–12px

**Primary:**

* background: burgundy  
* text: white

**Secondary:**

* light blue or outline

**Rules:**

* Only ONE primary button per screen  
  ---

  ### **Inputs**

* Clean, minimal  
* Always include helper text when needed  
* Inline validation

Example:

“Max 1000 pages per session”

---

### **Cards / Sections**

* Prefer sections over heavy cards  
* If used:  
  * light border  
  * subtle shadow  
  * generous padding

  ---

  ### **Charts**

* Minimal visual noise  
* No heavy gridlines  
* Focus on readability  
  ---

  ## **7\. Interaction Design**

  ### **Motion**

* subtle  
* 150–300ms  
* no dramatic animations  
  ---

  ### **Microinteractions**

Required:

* session logged → feedback  
* reflection saved → confirmation  
* streak star → gentle appearance  
* book completed → subtle highlight  
  ---

  ### **Avoid**

* bounce effects  
* gamified animations  
* flashy transitions  
  ---

  ## **8\. Screen-Specific Guidelines**

  ### **Home**

Focus: continuation

Show:

* current book  
* log session CTA  
* minimal stats  
  ---

  ### **Log Session**

* fast input  
* minimal visible fields  
* immediate feedback  
  ---

  ### **Reflection**

* distraction-free  
* one question at a time  
* large text area  
  ---

  ### **Recommendations**

* max 3 books  
* explanation visible immediately  
* no infinite scroll  
  ---

  ### **Stats**

* max 3 charts  
* simple layout  
* no clutter  
  ---

  ## **9\. Content & Copywriting**

  ### **Tone**

* calm  
* thoughtful  
* slightly introspective  
* polite  
  ---

  ### **Examples**

Good:

* “Start by logging one session”  
* “Add a book you’re currently reading”  
* “This helps improve your recommendations”

Bad:

* “Let’s go 🚀”  
* “You’re crushing it\!\!\!”  
  ---

  ### **Error Tone**

* polite  
* human

Example:

“Something went wrong. Try again.”

---

## **10\. Empty States**

Tone:

* calm  
* guiding  
* minimal

Example:

“You haven’t added a book yet.  
Start by adding what you’re reading.”

---

## **11\. Accessibility (Priority Scope)**

Focus on:

* minimum 16px text  
* strong contrast  
* clear labeling  
  ---

  ## **12\. Do / Don’t Summary**

  ### **Do**

* guide users step-by-step  
* reduce visible choices  
* keep UI calm and breathable  
* prioritize clarity  
  ---

  ### **Don’t**

* build dense dashboards  
* show all features at once  
* overuse color or animation  
* turn it into a productivity tool  
  ---

  ## **Final Principle**

If a screen feels full, it’s wrong.

---

## **13\. Styling & Implementation (Tailwind)**

### **Purpose**

Ensure consistent, predictable UI implementation.

---

### **Core Rules**

* Use defined design tokens only  
* No random hex values  
* No arbitrary spacing  
* Reuse components  
  ---

  ### **Color Tokens**

* background-default → \#F9EEE5  
* text-primary → \#1A1A1A  
* text-secondary → \#5F5F5F  
* border-subtle → \#E3DED8  
*   
* brand-burgundy → \#6B2137  
* brand-burgundy-hover → \#541A2B  
* brand-burgundy-soft → \#F6E9EC  
*   
* brand-blue → \#B7D8FF  
* brand-blue-hover → \#9FC6F0  
* brand-blue-soft → \#EEF6FF  
*   
* error → \#FC4D17  
* error-bg → \#FFEDE6  
*   
* success → \#5FA86E  
* success-bg → \#EAF6ED  
    
  ---

  ### **Typography Tokens**

* `font-sans` → Clash Grotesque  
* `font-serif` → Sentient Regular  
  ---

  ### **Spacing**

Use only:

* 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64  
    
  ---

  ### **Components**

Create reusable:

* buttons  
* inputs  
* containers  
* sections  
  ---

  ### **Responsive Rules**

Mobile:

* prioritize speed and clarity  
* vertical layout

Desktop:

* more space, not more elements  
  ---

  ### **Motion**

* subtle transitions only  
* no heavy animations  
  ---

  ### **Final Implementation Principle**

The UI should feel calm, consistent, intentional, and light — never busy or overdesigned.

---

