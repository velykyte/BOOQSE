

# **BOOQSE — SECURITY CHECKLIST**

## **1\. Purpose**

This checklist defines the minimum security requirements for the Booqsy MVP.

It prevents common risks in:

* authentication  
* API usage  
* privacy  
* database access  
* AI features  
* deployment

This is an **MVP security baseline**, not an enterprise security system.

---

## **2\. Core Security Principles**

**All trust decisions happen on the backend**  
Frontend improves UX, but backend enforces:

* access  
* ownership  
* limits  
* privacy

**Least exposure**  
Return only the data required for a screen.

**Secrets never go to the client**  
All keys and credentials remain server-side.

**Validate \+ sanitize everything**  
Frontend \= UX  
Backend \= security

**Default to private**  
Especially:

* reflections  
* AI inputs  
* reading history

---

## **3\. Secrets & Environment Variables**

### **Rules**

* Never store secrets in docs, code, or logs  
* Never expose secrets in frontend  
* Never commit `.env.local`  
* Use environment variables only  
* Separate environments (local / preview / prod)  
* Access secrets only server-side

### **Expected secrets**

* OPENAI\_API\_KEY  
* GOOGLE\_BOOKS\_API\_KEY  
* Google auth secrets  
* InstantDB credentials  
* Session/auth secrets

### **Checklist**

* `.env.local` in `.gitignore`  
* No secrets in repo history  
* No secrets in client bundle  
* Vercel env vars used for production  
* Preview ≠ production secrets  
* Old secrets removed

---

## **4\. Authentication**

### **Rules**

* Require auth for all personal features  
* Use Google auth (MVP)  
* Validate auth on every request  
* Never trust frontend userId

### **Checklist**

* Protected routes require auth  
* Backend verifies session on every request  
* Invalid sessions rejected safely  
* Logout clears access properly

---

## **5\. Authorization & Ownership**

### **Rules**

Users can only access their own data:

* books  
* sessions  
* reflections  
* ratings  
* reviews  
* recommendations

### **IDOR Protection (critical)**

Never trust resource IDs from client.

### **Checklist**

* Every query checks ownership (`userId`)  
* IDs alone do not grant access  
* Users cannot modify others’ data  
* Public endpoints respect ownership rules

---

## **6\. Privacy Model**

### **Rules**

* Reflections → always private  
* Reviews → public  
* Titles → can be hidden  
* Stats → can be hidden  
* Profile → can be private

Privacy is enforced on backend, not UI.

### **Checklist**

* Reflections never exposed publicly  
* Public APIs filter private fields  
* Hidden titles never leak  
* Hidden stats never leak  
* Private profiles not discoverable  
* Comparison respects privacy

---

## **7\. Input Validation**

### **Rules**

Validate all inputs on backend.

### **Required validations**

* pages\_read: 1–1000  
* time\_minutes: 1–720  
* rating: 1–10  
* valid statuses only  
* valid dates only

### **Checklist**

* Invalid values rejected  
* Negative values rejected  
* Status transitions controlled  
* Past vs live data separated

---

## **7A. Input Sanitization** 

### **Rules**

Sanitize all user text inputs.

Applies to:

* reflections  
* reviews  
* any free text

### **Prevent**

* XSS  
* script injection  
* unsafe rendering

### **Checklist**

* No raw HTML rendering  
* All text escaped  
* `<script>` cannot execute  
* Unsafe characters handled

---

## **8\. API Security**

### **Rules**

* OpenAI calls → server only  
* Secret APIs → server only  
* Validate all request bodies  
* Return safe errors only

### **Checklist**

* No stack traces exposed  
* No secrets in responses  
* Minimal data returned

---

## **8A. CORS & API Exposure** 

### **Rules**

Restrict which domains can access API.

### **Checklist**

* Only your domain allowed in prod  
* No wildcard `*`  
* Credentials restricted  
* Internal APIs protected

---

## **9\. AI Security**

### **Risks**

* private data exposure  
* prompt injection  
* unsafe outputs

### **Rules**

* Send minimal data to AI  
* Treat output as untrusted  
* Do not expose system prompts

### **Allowed inputs**

* ratings  
* reflections  
* reviews

### **Checklist**

* AI output sanitized  
* No raw HTML injection  
* Prompt logic protected  
* Sensitive data minimized

---

## **9A. AI Prompt Injection Safety** 

### **Rules**

User input must not override system logic.

### **Checklist**

* System prompt is fixed  
* User input treated as data only  
* AI instructions cannot be hijacked

---

## **10\. Rate Limiting & Abuse Prevention**

### **Rules**

Apply limits on backend.

### **Minimum limits**

* Recommendations → 3/day/user  
* Auth → 5–10/min/IP  
* General API → per-user/IP caps

### **Checklist**

* Limits enforced server-side  
* Cannot bypass via frontend  
* Abuse handled safely  
* Safe error message returned

---

## **11\. Database Security**

### **Rules**

* All records tied to userId  
* Separate private vs public data  
* Clean deletions

### **Checklist**

* Ownership enforced  
* Reflections separate from reviews  
* No orphaned data  
* Safe account deletion

---

## **12\. Logging & Monitoring**

### **Rules**

* Do not log secrets  
* Avoid logging private reflections  
* Limit AI payload logging

### **Checklist**

* Tokens never logged  
* Logs privacy-safe  
* Errors safe for users

---

## **13\. Frontend Security**

### **Rules**

Frontend is not trusted.

### **Checklist**

* No secrets in client  
* Sensitive logic server-side  
* No sensitive local storage  
* AI output safely rendered

---

## **13A. Web Security Headers**

### **Checklist**

* Basic CSP enabled  
* X-Frame-Options set  
* X-Content-Type-Options set  
* Referrer policy restricted

---

## **14\. Session & Cookie Safety**

### **Rules**

* Use secure cookies  
* HTTPS required

### **Checklist**

* HTTPS enforced  
* Secure cookies in production  
* Invalid sessions rejected

---

## **15\. Public Profile Safety**

### **Rules**

* No reflection exposure  
* Respect privacy settings

### **Checklist**

* Hidden data stays hidden  
* Private users not searchable  
* Comparison respects visibility

---

## **16\. File Safety (Future)**

### **Rules**

* Validate type \+ size  
* Do not trust file extensions

### **Checklist**

* No executable uploads  
* Safe rendering only

---

## **17\. Dependency Safety**

### **Rules**

* Use minimal packages  
* Review dependencies

### **Checklist**

* Up-to-date packages  
* Remove unused libs  
* Review third-party code

---

## **18\. Deployment Security**

### **Rules**

* Separate environments  
* Never mix credentials

### **Checklist**

* HTTPS enabled  
* Env vars correct  
* Preview ≠ production  
* Access restricted

---

## **19\. Data Lifecycle**

### **Rules**

Users control their data.

### **Checklist**

* Safe edits/deletes  
* No leftover data leaks  
* Privacy updates apply immediately

---

## **20\. Business Logic Security**

### **Critical rules**

* Recommendations require 3+ rated books  
* Refresh limit enforced server-side  
* Ratings only for finished/past books  
* Streak rules enforced  
* Past books excluded from live stats

### **Checklist**

* All logic enforced backend-side  
* No client-side bypass possible

---

## **21\. Error Handling**

### **Rules**

Errors must not leak internals.

### **Good**

* “Something went wrong”

### **Avoid**

* stack traces  
* SQL errors  
* API dumps

---

## **22\. Pre-Launch Review**

Verify:

* secrets secure  
* auth works  
* ownership enforced  
* privacy enforced  
* AI safe  
* API safe  
* deployment correct

---

## **23\. MVP Priorities**

If limited time, prioritize:

1. secrets  
2. auth  
3. ownership  
4. reflection privacy  
5. AI server-side  
6. input validation \+ sanitization  
7. rate limiting  
8. privacy filtering  
9. safe errors  
10. HTTPS

---

## **24\. Final Rule**

👉 If data is private, identity-linked, or expensive  
→ **protect it on the backend**

---

