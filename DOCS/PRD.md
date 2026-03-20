Here is your **rewritten, aligned, and cleaned PRD** with all fixes applied and inconsistencies removed:

---

# **PRODUCT REQUIREMENTS DOCUMENT (PRD)**

## **Product: Booqse**

**Type:** Web app (Vercel)  
**Goal:** Help users track reading, reflect deeply, and confidently choose books

---

## **Product Vision**

**Booqse helps users choose books that match where they are right now.**

Instead of relying on static ratings or past preferences, the app captures signals from a user’s current reading experience—through sessions, reflections, and feedback—to understand what resonates in the moment.

By adapting to the user’s evolving mindset, Booqse reduces decision fatigue and enables confident, relevant book choices without overthinking.

---

## **1\. Core Objective**

Build a system that:

* tracks reading behavior (pages, time, sessions)  
* improves retention via structured reflection  
* develops user taste awareness  
* reduces decision fatigue via AI recommendations

**Primary success metric:**  
→ Average sessions logged per user

---

## **2\. Core Entities (Product-Level)**

### **User**

* id  
* email (Google auth)  
* name  
* timezone  
* privacy settings (future-ready):  
  * profile visibility (public/private)  
  * stats visibility  
  * book titles visibility

---

### **Book**

* id (Google Books API)  
* title  
* author  
* thumbnail

---

### **UserBook**

Represents relationship between user and book

* user\_id  
* book\_id  
* status:  
  * want\_to\_read  
  * currently\_reading  
  * finished  
* is\_past\_book (boolean)  
* user\_defined\_total\_pages  
* rating (1–10, only if finished or past)  
* finished\_at

---

### **ReadingSession**

* id  
* user\_id  
* book\_id  
* date  
* pages\_read (max 1000\)  
* time\_minutes (max 720\)  
* start\_time (optional)  
* end\_time (optional)

**Rules**

* multiple sessions per day allowed  
* both pages \+ time required  
* editable

---

### **Reflection**

(private, per session)

* id  
* session\_id  
* answers:  
  * What is this book trying to show or teach?  
  * What new idea or perspective did I get?  
  * What part made me stop, think, or feel—and why?  
  * Do I agree with the main idea? Why or why not?  
  * What is one thing I want to remember?

---

### **Review**

(public, per book)

* id  
* user\_id  
* book\_id  
* text

**Rule:**  
→ One review per user per book (editable)

---

### **AIRecommendation**

* id  
* user\_id  
* generated\_at  
* books (3 items):  
  * title  
  * author  
  * explanation (short)

**Constraint:**  
→ Max 3 refreshes per day

---

## **3\. Core Features**

---

### **3.1 Book Management**

* Search via Google Books API  
* Add book:  
  * set status (want / current)  
  * manually input total pages (required for tracking)  
* Track multiple books simultaneously  
* Mark as finished  
* Delete books

---

### **3.2 Reading Tracking**

* Log session:  
  * pages \+ time (required)  
* Progress:  
  * based on pages / total\_pages  
* Multiple sessions per day  
* Edit past sessions

---

### **3.3 Past Books**

Users can add books read before joining.

**Can:**

* rate  
* write a review

**Do NOT:**

* affect stats or graphs  
* include reflections (MVP)  
* create reading sessions

**Do:**

* affect AI recommendations  
* affect taste profile

---

### **3.4 Reflection System**

* Optional after each session  
* Stored per session  
* Fully private  
* Viewable per book

Used for:

* AI recommendations  
* taste profile extraction

---

### **3.5 Rating System**

* Scale: 1–10  
* Only for:  
  * finished books  
  * past books  
* Editable

---

### **3.6 AI Recommendation System**

**Trigger:**

* On demand

**Requirements:**

* ≥ 3 rated books

**Inputs:**

* book ratings  
* reflections  
* reviews

**Output:**

* 3 book recommendations  
* each includes short explanation

**Behavior:**

* max 3 refreshes per day

---

### **3.7 Taste Profile (AI)**

Generated from:

* ratings  
* reflections  
* reviews

**Behavior:**

* stored (cached) per user  
* updated when:  
  * rating changes  
  * reflection changes  
  * review changes

**Displayed:**

* inside user profile

**Purpose:**

* help users understand their preferences  
* reduce reliance on external validation

---

### **3.8 Stats & Analytics (MVP)**

Includes:

* pages per day (line chart)  
* time per day  
* average reading speed (pages/hour)

**Rules:**

* based only on real-time sessions  
* excludes past books

---

### **3.9 Streak System**

* Based on calendar days  
* A reading day \= any valid reading session logged that day

**Behavior:**

* missed day → streak resets  
* stars remain in calendar

**Calendar:**

* shows “gold star” per reading day  
* monthly stat: total reading days

**Edge case:**

* retroactive logging allowed up to 1 day back

---

## **4\. Onboarding Flow**

After signup, user chooses:

* Add past books (rate them)  
* OR add a current book and start logging

No complex onboarding. Immediate action.

---

## **5\. Pages (MVP Structure)**

/auth (login/signup)

/ (home)

  \- current books

  \- quick stats

  \- log session CTA

/book/\[id\]

  \- progress

  \- sessions

  \- reflections

  \- review

/add-book

/stats

/recommendations

/profile

  \- taste profile

  \- reading summary

---

## **6\. Integrations**

* Google Books API → book data  
* OpenAI API → recommendations \+ taste profile  
* Google Auth → authentication  
* InstantDB → database  
* Vercel → deployment

---

## **7\. Constraints / Rules**

* pages per session ≤ 1000  
* time per session ≤ 12h  
* recommendations require ≥ 3 rated books  
* reflections always private  
* reviews always public  
* manual page count required for tracking

---

## **8\. Out of Scope (MVP)**

* goals system  
* social features (follow, comparison)  
* public profile browsing  
* advanced analytics  
* gamification beyond streak

---

## **9\. Key Risks**

* invalid or fake session data  
* weak recommendations with low data  
* UI becoming too complex

---

## **10\. Product Principle**

This is NOT Goodreads.

Focus:

* thinking \> consuming  
* clarity \> volume  
* self-trust \> external validation

---

## **Final Note**

Booqse is not just a tracking tool.  
It is a system designed to help users **understand themselves through reading and make better choices with less friction**.

