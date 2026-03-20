# **Booqse — Tech Stack Document**

## **1\. Purpose**

This document defines the recommended technical stack for the Booqse MVP web application.

The goal is to support:

* fast MVP development  
* clean deployment  
* secure API usage  
* scalable UI implementation  
* AI-assisted coding in Cursor

This stack is optimized for:

* Vercel deployment  
* calm, content-driven product UX  
* low-complexity MVP architecture  
* future iteration without heavy rewrites

---

## **2\. Recommended Architecture Overview**

### **Frontend**

* Next.js  
* React  
* Tailwind CSS  
* optional later: shadcn/ui  
* chart library for reading statistics

### **Backend**

* Next.js server-side layer  
* Route Handlers / Server Functions  
* business logic for recommendations, books, logging, privacy, and secure API calls

### **Database**

* InstantDB

### **Authentication**

* Google Authentication

### **External APIs**

* Google Books API  
* OpenAI API

### **Deployment**

* Vercel

---

## **3\. Frontend Stack**

### **3.1 Next.js**

Use Next.js as the main web framework.

**Why**

* excellent fit for Vercel  
* built-in routing  
* supports both frontend and backend logic  
* good structure for scalable product development  
* works well with React and Tailwind  
* supports server and client rendering patterns

**Recommended approach**

* use App Router  
* organize pages and layouts by product area  
* use `/` as the Home route

**Use Next.js for**

* routing  
* layouts  
* page rendering  
* server-side integrations  
* API endpoints if needed

---

### **3.2 React**

Use React as the UI layer through Next.js.

**Why**

* flexible component model  
* ideal for reusable UI patterns  
* strong ecosystem support with Next.js  
* works well with Cursor and AI-generated code

**Use React for**

* reusable UI components  
* stateful forms  
* book cards  
* session forms  
* reflection flows  
* recommendation cards  
* home and stats sections

---

### **3.3 Tailwind CSS**

Use Tailwind CSS as the primary styling system.

**Why**

* fast implementation  
* consistent design system enforcement  
* ideal for AI-assisted UI building  
* reduces CSS sprawl  
* maps well to design tokens

**Use Tailwind for**

* layout  
* spacing  
* typography  
* color system  
* components  
* responsive behavior

**Rule**

* use defined design tokens and shared utility patterns  
* avoid random one-off styling decisions

---

### **3.4 Optional UI Component Layer**

Optional later:

* shadcn/ui

**Why**

* speeds up common component building  
* keeps control over styling  
* integrates well with Tailwind

Use only if it improves speed without adding visual noise.

---

### **3.5 Charts**

Use a simple chart library for stats pages.

**Recommended**

* Recharts

**Use for MVP charts**

* pages read per day  
* time read per day  
* average reading speed

**Rules**

* charts must stay minimal  
* no visual clutter  
* prioritize readability over decoration

---

## **4\. Backend Stack**

### **4.1 Backend Approach**

Do not build a separate heavy backend for MVP.

**Recommended approach**

* use Next.js server-side capabilities  
* keep backend logic close to the app  
* use secure server endpoints for external API communication

**Why**

* simpler architecture  
* easier deployment  
* less DevOps overhead  
* faster iteration

---

### **4.2 Next.js Server Layer**

Use Next.js Route Handlers and/or server-side functions for backend logic.

**Use backend for**

* secure OpenAI requests  
* secure Google Books requests if needed  
* recommendation generation  
* taste profile generation  
* input validation and sanitization  
* session processing  
* rate limiting  
* user-specific access control  
* privacy enforcement

**Important**

* API keys must only be used server-side  
* do not expose sensitive logic in the client

---

### **4.3 Backend Responsibilities**

The backend should handle:

* authentication session checks  
* creating and updating reading records  
* validating pages and time constraints  
* sanitizing text inputs  
* enforcing ownership checks  
* enforcing recommendation eligibility  
* enforcing refresh limits  
* enforcing privacy rules  
* transforming database data into AI-ready input  
* protecting against prompt injection and unsafe output rendering

**Example backend validations**

* pages per session must not exceed 1000  
* reading time must not exceed 12 hours  
* recommendations require at least 3 rated books  
* recommendation refresh limit \= 3 per day  
* ratings only allowed for finished books or past books  
* reflections only allowed for logged sessions

---

## **5\. Database**

### **5.1 Primary Database**

Use InstantDB as the main database.

**Why**

* aligned with your preference  
* suitable for modern app development  
* good fit for user activity, structured records, and dynamic updates

**Use InstantDB for**

* users  
* books  
* user books  
* reading sessions  
* reflections  
* reviews  
* recommendation history  
* privacy-related profile fields  
* cached taste profile data  
* streak-related data if persisted

---

### **5.2 Core Data Entities**

Recommended entities:

* User  
* Book  
* UserBook  
* ReadingSession  
* Reflection  
* Review  
* AIRecommendation  
* AIRecommendationItem

**Notes**

* past books are handled through `UserBook.is_past_book`  
* recommendation inputs should include ratings, reflections, and reviews  
* past books affect recommendations and taste profile  
* past books do not affect session-based stats  
* one review per user per book  
* reflections are tied only to reading sessions

---

## **6\. Authentication**

### **6.1 Auth Provider**

Use Google Authentication.

**Why**

* lower signup friction  
* good UX for MVP  
* reduces password management complexity

**Recommended usage**

* Google sign-in only for MVP  
* connect authenticated identity to database records

**Important**

* keep auth flow simple  
* after sign-up, route users directly into first-run onboarding

### **6.2 Auth \+ InstantDB Integration**

Exact auth integration should follow InstantDB’s recommended Next.js pattern during implementation.

Do not lock a more specific auth architecture in this document before implementation validation.

---

## **7\. External APIs**

### **7.1 Google Books API**

Use Google Books API for:

* searching books  
* title metadata  
* authors  
* covers  
* publishing metadata when available

**Important product rule**

* total page count for active tracking must still be entered manually by the user  
* do not rely on Google Books page counts for progress tracking

**Use cases**

* add current book  
* add past books  
* enrich recommendation results

---

### **7.2 OpenAI API**

Use OpenAI API for:

* generating book recommendations  
* generating short explanations for recommendations  
* generating taste profile insights

**Recommendation inputs should include**

* rated finished books  
* past books with ratings  
* private reflections  
* public reviews written by the user

**Recommendation output should include**

* exactly 3 books  
* short explanation for each

**Important rules**

* recommendation generation happens on demand  
* only available when user has at least 3 rated books  
* user can refresh max 3 times per day  
* AI calls must remain server-side  
* user input must be treated as untrusted

**Taste profile**

* summarizes themes, preferences, and patterns  
* displayed in the user’s own profile  
* stored/cached and updated when relevant inputs change

---

## **8\. Deployment**

### **8.1 Hosting Platform**

Use Vercel.

**Why**

* native fit for Next.js  
* simple deployment workflow  
* easy environment variable management  
* preview deployment support

**Use Vercel for**

* production deployment  
* preview deployments  
* environment variable storage

---

## **9\. Environment Variables**

### **9.1 Security Rule**

Do not store API keys in documents, client code, or public repositories.

Store them in environment variables only.

**Local development**

* `.env.local`

**Deployment**

* Vercel Environment Variables

---

### **9.2 Expected Environment Variables**

Examples:

* `OPENAI_API_KEY`  
* `GOOGLE_BOOKS_API_KEY`  
* auth-related environment variables  
* InstantDB environment variables

**Important**

* include variable names in technical docs if needed  
* never include actual secret values

---

## **10\. Frontend / Backend Separation**

### **Frontend should handle**

* rendering pages  
* collecting user input  
* displaying progress  
* displaying stats and recommendations  
* navigating flows  
* handling UI state

### **Backend should handle**

* secure API requests  
* database writes and updates  
* validation and sanitization  
* recommendation generation  
* privacy enforcement  
* refresh limits  
* eligibility checks  
* ownership checks  
* text safety and secure output handling

**Rule**

* anything involving secrets, AI calls, private data, or business logic enforcement must stay on the backend

---

## **11\. Suggested Project Modules**

### **App Areas**

* auth  
* onboarding  
* books  
* reading sessions  
* reflections  
* reviews  
* recommendations  
* stats  
* profile  
* shared UI components  
* shared server utilities

### **Shared Logic Areas**

* validation helpers  
* sanitization helpers  
* recommendation formatting  
* chart data transformation  
* privacy filters  
* ownership guards  
* date and timezone utilities  
* rate limiting utilities

---

## **12\. MVP Technical Scope**

### **Must-have**

* Google auth  
* book search via Google Books API  
* add current books  
* add past books  
* reading session logging  
* reflection saving  
* review saving  
* finished/past book rating  
* stats generation  
* streak/calendar logic  
* AI recommendations  
* cached taste profile generation  
* Vercel deployment

### **Not needed yet**

* separate backend service  
* follow system  
* public profile browsing  
* social feed  
* goals system  
* advanced analytics  
* dark mode

---

## **13\. Technical Principles**

### **Keep architecture simple**

Do not overengineer the MVP.

### **Keep secrets server-side**

Never expose API keys in the browser.

### **Keep logic reusable**

Validation, sanitization, recommendation formatting, and chart transformation should live in reusable helpers.

### **Keep UI and business logic separated**

The frontend presents. The backend decides.

### **Keep the stack aligned with product goals**

This is a calm, content-focused app — not a complex enterprise dashboard.

---

## **14\. Final Recommended Stack**

### **Frontend**

* Next.js  
* React  
* Tailwind CSS  
* optional later: shadcn/ui  
* Recharts (or equivalent lightweight chart library)

### **Backend**

* Next.js server-side layer  
* Route Handlers / server-side functions

### **Database**

* InstantDB

### **Auth**

* Google Authentication

### **APIs**

* Google Books API  
* OpenAI API

### **Deployment**

* Vercel

---

## **15\. Final Recommendation Summary**

This stack is the best fit for the Booqse MVP because it is:

* fast to build  
* easy to deploy  
* secure enough for MVP use  
* compatible with AI-assisted development  
* simple without being limiting

It provides a clean base for building the product without unnecessary technical complexity.

