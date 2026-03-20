Here is your **clean, aligned, and decision-consistent App Flow Document** rewritten to match your PRD \+ Schema:

---

# **Booqse — App Flow Document**

## **Product**

Reading tracker \+ reflection \+ AI recommendation web app

---

## **1\. UX Principles**

* **One primary action per screen**  
  Reduce cognitive load. Guide step-by-step.  
* **Progressive disclosure**  
  Reveal features only when needed.  
* **Recognition over recall**  
  Use visible prompts, defaults, and clear labels.  
* **System status visibility**  
  Always show progress, eligibility, and next steps.  
* **Prevent bad input early**  
  Inline validation for pages, time, rating.  
* **Reflection is optional**  
  Encourage, never force.

---

## **2\. Primary User Journeys (MVP)**

* Sign up and start  
* Add current book → log session  
* Add past books → rate  
* View stats  
* Get AI recommendations  
* View taste profile

Everything else is secondary.

---

## **3\. Global Navigation**

Max 4 items:

* Home  
* Stats  
* Recommendations  
* Profile

**Rules**

* Show **“Log Reading” CTA only if user has active book**  
* No feature dumping in nav  
* Secondary actions are contextual (inside screens)

---

## **4\. Entry Flow**

### **4.1 Landing / Auth**

**Goal:** fast entry

* “Continue with Google”  
* Short value proposition:  
  * Track your reading  
  * Reflect on what you read  
  * Get better recommendations

→ Immediately go to onboarding

---

## **5\. First-Run Onboarding**

### **5.1 Welcome Choice**

**Question:**  
“How do you want to begin?”

Options:

* I’m reading a book now  
* I want to add books I’ve already read

Small note:  
“You can do the other later”

---

## **6\. Path A — Current Book**

### **6.1 Add Book**

* Search (Google Books API)  
* Select book  
* Enter total pages (required)

**UI rule**  
Explain:  
“Used for accurate progress tracking”

---

### **6.2 Success State**

Show:

* book cover  
* 0% progress

Primary CTA:  
→ Log first session

No dashboard yet.

---

## **7\. Path B — Past Books**

### **7.1 Add Past Books Loop**

Flow:

* search book  
* mark as finished  
* rate (1–10)  
* optional review

After save:

* Add another  
* Continue

---

### **7.2 Recommendation Readiness**

If \< 3 rated books:

Show:  
“Add 3 rated books to unlock recommendations”

---

## **8\. Home (Main Screen)**

### **If no current book**

* Empty state  
* CTA: Add current book  
* Secondary: Add past books

---

### **If user has active book**

Show in order:

1. Continue reading card  
2. Log session CTA  
3. Small summary:  
   * today’s pages  
   * time  
   * streak  
4. Current books shelf

**Do NOT show charts**

---

## **9\. Log Reading Session Flow**

### **9.1 Select Book**

* Skip if only 1 book  
* Use cards (not dropdown)

---

### **9.2 Session Input**

Fields:

* pages\_read  
* time\_minutes

Optional:

* start\_time  
* end\_time

**Validation**

* pages: 1–1000  
* time: 1–720

Inline messages:  
“That seems unusually high”

---

### **9.3 Success State**

Show:

* updated progress  
* streak  
* today totals

Primary CTA:  
→ Add reflection

Secondary:  
→ Done

---

## **10\. Reflection Flow**

### **10.1 Input**

* One question at a time  
* Allow:  
  * skip  
  * partial save

**Important**

* Only available after a session  
* Not available for past books

---

### **10.2 Completion**

Show:

* “Reflection saved”  
* “Used to improve recommendations”

---

## **11\. Book Detail Page**

Sections:

* Header:  
  * cover, title, status, progress  
* Actions:  
  * log session  
  * mark as finished  
* Content:  
  * sessions  
  * reflections  
  * review

---

### **For Finished Books**

Show:

* rating  
* total time  
* review

---

## **12\. Finish Book Flow**

### **12.1 Completion**

When marking finished:

* confirm  
* ask for rating (1–10)  
* optional review

---

### **12.2 Completion State**

Show:

* “You finished this book”  
* total reading time

CTA:

* Get recommendations (if eligible)

---

## **13\. Recommendations Flow**

### **13.1 Locked State**

If \< 3 rated books:

Show:

* requirement  
* progress (e.g. “2 of 3”)

---

### **13.2 Generate**

User taps:  
→ Get recommendations

Uses:

* ratings  
* reflections  
* reviews

---

### **13.3 Results**

Show exactly 3 items:

Each:

* cover  
* title  
* author  
* explanation

Actions:

* Want to Read  
* Mark as Finished

---

### **13.4 Refresh**

* Secondary button  
* Show remaining refresh count

---

## **14\. Stats Flow**

### **14.1 Overview**

Show only:

* pages per day  
* time per day  
* avg reading speed

Above:

* streak  
* reading days (month)  
* total pages (month)

---

### **14.2 Calendar**

* star per reading day  
* streak resets on miss  
* stars persist

Optional:

* click day → view sessions

---

## **15\. Profile Flow**

### **15.1 Overview**

Show:

* profile info  
* books finished  
* streak  
* taste profile

---

### **15.2 Taste Profile**

AI-generated summary:

* themes  
* tone  
* thinking patterns

**Rule**

* stored and updated when inputs change

---

### **15.3 Shelves**

* Want to Read  
* Currently Reading  
* Finished

---

### **15.4 Settings (Low Priority)**

* profile visibility  
* stats visibility  
* book titles visibility

---

## **16\. Information Architecture**

### **Top-level**

* Home  
* Stats  
* Recommendations  
* Profile

---

### **Contextual only**

* Add book  
* Log session  
* Reflection  
* Review  
* Book details

---

## **17\. Key UX Rules**

### **Do**

* Guide step-by-step  
* Use empty states  
* Gate recommendations clearly  
* Ask reflection after action  
* Keep UI calm

---

### **Don’t**

* Build dense dashboards  
* Show all features at once  
* Force reflection  
* Add social features  
* Overcomplicate navigation

---

## **18\. Final Flow Summary**

Sign up → choose path →  
add current or past books →  
log sessions → reflect (optional) →  
view stats → get recommendations →  
build taste profile

---

## **Final Principle**

If a screen feels full, it is wrong.

