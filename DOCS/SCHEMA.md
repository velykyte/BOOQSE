

# **Booqse — Database Schema & Relationships**

## **1\. Purpose**

This document defines:

* core entities  
* relationships  
* field structure  
* constraints  
* suggested indexes

It ensures consistency across:

* database design  
* backend logic  
* API responses  
* AI recommendation inputs

---

## **2\. Design Principles**

* Scope all user-owned data by `user_id`  
* Separate private vs public content  
* Keep past-book data separate from real-time session data  
* Enforce validation and ownership on backend  
* Keep schema simple and stable for MVP

---

## **3\. Core Entities**

### **3.1 User**

Represents an authenticated user.

**Fields**

* `id`: string (PK)  
* `email`: string (unique, required)  
* `name`: string (required)  
* `timezone`: string (required)  
* `profile_visibility`: enum (`public`, `private`)  
* `stats_visibility`: boolean  
* `book_titles_visibility`: boolean  
* `taste_profile_summary`: text (optional)  
* `taste_profile_updated_at`: datetime (optional)  
* `created_at`: datetime  
* `updated_at`: datetime

**Notes**

* One user → many books, sessions, reflections, reviews, recommendations

---

### **3.2 Book**

Canonical book metadata (from Google Books).

**Fields**

* `id`: string (PK)  
* `google_books_id`: string (unique, required)  
* `title`: string (required)  
* `author`: string or string\[\]  
* `thumbnail_url`: string (optional)  
* `published_date`: string (optional)  
* `created_at`: datetime

**Notes**

* Shared across all users  
* Page count is NOT stored here

---

### **3.3 UserBook**

User’s relationship to a book.

**Fields**

* `id`: string (PK)  
* `user_id`: FK → User.id  
* `book_id`: FK → Book.id  
* `status`: enum (`want_to_read`, `currently_reading`, `finished`)  
* `is_past_book`: boolean (required)  
* `user_defined_total_pages`: integer (optional)  
* `rating`: integer (optional)  
* `finished_at`: datetime (optional)  
* `created_at`: datetime  
* `updated_at`: datetime

**Constraints**

* Rating allowed only if:  
  * `status = finished` OR `is_past_book = true`  
* Rating range: `1–10`  
* Active tracked books should require `user_defined_total_pages`  
* One record per user per book (recommended for MVP)

**Notes**

* Central entity for reading state  
* Past books:  
  * can have rating \+ review  
  * do NOT have sessions or reflections in MVP

---

### **3.4 ReadingSession**

Represents a reading event.

**Fields**

* `id`: string (PK)  
* `user_id`: FK → User.id  
* `user_book_id`: FK → UserBook.id  
* `book_id`: FK → Book.id  
* `date`: date (required)  
* `pages_read`: integer (required)  
* `time_minutes`: integer (required)  
* `start_time`: datetime (optional)  
* `end_time`: datetime (optional)  
* `created_at`: datetime  
* `updated_at`: datetime

**Constraints**

* `pages_read`: 1–1000  
* `time_minutes`: 1–720  
* Both required  
* Must belong to same `user_id` as UserBook  
* Multiple sessions per day allowed

**Notes**

* Defines a “reading day”  
* Past books do NOT create sessions

---

### **3.5 Reflection**

Private reflection tied to a session.

**Fields**

* `id`: string (PK)  
* `user_id`: FK → User.id  
* `reading_session_id`: FK → ReadingSession.id  
* `question_1`: text (optional)  
* `question_2`: text (optional)  
* `question_3`: text (optional)  
* `question_4`: text (optional)  
* `question_5`: text (optional)  
* `created_at`: datetime  
* `updated_at`: datetime

**Constraints**

* Always private  
* Must belong to same user  
* Max 1 reflection per session

**Notes**

* Only created after a session  
* Not supported for past books in MVP

---

### **3.6 Review**

Public review for a book.

**Fields**

* `id`: string (PK)  
* `user_id`: FK → User.id  
* `user_book_id`: FK → UserBook.id  
* `book_id`: FK → Book.id  
* `text`: text (required)  
* `created_at`: datetime  
* `updated_at`: datetime

**Constraints**

* Public  
* Only for:  
  * finished books  
  * or past books  
* **One review per user per book**  
* Editable

**Notes**

* Separate from reflections

---

### **3.7 AIRecommendation**

One recommendation generation event.

**Fields**

* `id`: string (PK)  
* `owner_user_id`: string (required, stable query field)  
* `generated_at`: datetime (required)  
* `created_at`: datetime
* `taste_profile_summary`: string (optional)

**Notes**

* Stores history of recommendations  
* No sensitive raw reflection data stored

---

### **3.8 AIRecommendationItem**

Individual recommendation result.

**Fields**

* `id`: string (PK)  
* `recommendation_id`: string (required, stable query field)  
* `owner_user_id`: string (optional, stable query field)  
* `book_title`: string (required)  
* `book_author`: string (optional)  
* `explanation`: text (required)  
* `position`: integer (required)  
* `google_books_id`: string (optional)  
* `thumbnail_url`: string (optional)  
* `published_date`: string (optional)  
* `book_authors_csv`: string (optional)

**Constraints**

* Exactly 3 items per recommendation  
* `position` \= 1, 2, or 3

---

## **4\. Relationships**

**User**

* has many → UserBook  
* has many → ReadingSession  
* has many → Reflection  
* has many → Review  
* has many → AIRecommendation

**Book**

* has many → UserBook  
* has many → ReadingSession  
* has many → Review

**UserBook**

* belongs to → User  
* belongs to → Book  
* has many → ReadingSession  
* has one → Review (MVP)

**ReadingSession**

* belongs to → User  
* belongs to → UserBook  
* belongs to → Book  
* has one → Reflection

**Reflection**

* belongs to → User  
* belongs to → ReadingSession

**Review**

* belongs to → User  
* belongs to → UserBook  
* belongs to → Book

**AIRecommendation**

* belongs to → User  
* has many → AIRecommendationItem

---

## **5\. Business Constraints**

### **Reading**

* Multiple books tracked simultaneously  
* Reading day \= any session logged that day

### **Rating**

* Only for:  
  * finished books  
  * past books  
* Range: 1–10

### **Sessions**

* Must include pages \+ time  
* Respect max limits

### **Reflection**

* Only after session  
* Always private

### **Reviews**

* Public  
* One per user per book

### **Recommendations**

* Requires ≥ 3 rated books  
* Max 3 refreshes per day  
* Returns exactly 3 books

### **Stats**

* Based only on real-time sessions  
* Past books excluded

---

## **6\. Suggested Indexes**

**User**

* index: `email`

**UserBook**

* index: `user_id`  
* index: `book_id`  
* composite: `(user_id, status)`

**ReadingSession**

* index: `user_id`  
* index: `user_book_id`  
* index: `date`  
* composite: `(user_id, date)`

**Reflection**

* index: `reading_session_id`  
* index: `user_id`

**Review**

* index: `user_id`  
* index: `book_id`  
* unique: `(user_id, book_id)`

**AIRecommendation**

* index: `user_id`  
* index: `generated_at`

---

## **7\. Privacy Boundaries**

**Always private**

* reflections  
* session-level data

**Public**

* reviews

**User-controlled (future-ready)**

* profile visibility  
* stats visibility  
* book titles visibility

---

## **8\. Data Separation Rules**

* Book → shared metadata  
* UserBook → reading state  
* ReadingSession → activity  
* Reflection → private thinking  
* Review → public opinion

Never merge these.

---

## **9\. Implementation Rules**

* Always validate ownership (`user_id`)  
* Never expose reflections publicly  
* Do not include past books in stats  
* Enforce rating rules backend-side  
* Enforce recommendation limits backend-side  
* Do not mix private and public data

---

## **10\. Final Principle**

**Shared data stays shared.**  
**Personal meaning stays user-scoped.**

