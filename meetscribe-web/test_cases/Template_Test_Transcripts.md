# Template Test Transcripts

Test cases for all 5 remaining templates (Meeting Minutes, Action Items, Sprint Grooming, Stakeholder Interview, UAT Demo Feedback). Each includes transcript and expected extraction results.

---

## 1. MEETING MINUTES TEMPLATE

### MM-020: Full Meeting Extraction

**Transcript:**

John: Good morning everyone. Today we're discussing the Q3 roadmap and resource allocation.
Sarah: I'd like to raise that we're short two developers for the mobile team.
Mike: Agreed. I think we should hire contractors for the next sprint.
John: Okay, let's go with contractors. Sarah, can you reach out to the agency by Thursday?
Sarah: Sure, I'll contact TechStaff agency by Thursday.
Priya: One question - do we have budget approval for contractors?
John: Good point. I'll check with finance and get back by Friday.
Mike: Also, the deployment pipeline is broken. Nothing can move until DevOps fixes it.
John: Noted. Mike, follow up with DevOps today. Next meeting is Tuesday at 10AM.

**Expected Results:**

- **Attendees:** John, Sarah, Mike, Priya
- **Key Topics:** Q3 roadmap, resource allocation, contractor hiring, deployment pipeline
- **Decisions:** Hire contractors for mobile team
- **Action Items:** Sarah - contact agency by Thursday | John - check budget with finance by Friday | Mike - follow up with DevOps today
- **Constraints:** Short 2 developers for mobile team
- **Questions:** Do we have budget approval for contractors?
- **Next Steps:** Next meeting Tuesday 10AM

---

### MM-021: Informal Agreement Detection

**Transcript:**

Sarah: What if we use Redis for caching instead of Memcached?
Mike: Makes sense. It has better data structures.
John: Yeah let's do that.

**Expected Results:**

- **Decisions:** Use Redis for caching instead of Memcached (rationale: better data structures)

---

### MM-022: Reversal Detection

**Transcript:**

John: Let's go with Plan A - deploy on Friday.
Sarah: Actually, wait. We haven't finished testing. Let's push to Monday instead.
John: You're right. Monday it is.

**Expected Results:**

- **Decisions:** Deploy on Monday (NOT Friday - that was overruled)

---

### MM-023: Question That Becomes Action Item

**Transcript:**

Priya: Can the existing API handle file uploads over 50MB?
John: Good question. Let me investigate that and report back by Thursday.

**Expected Results:**

- **Questions:** Can the existing API handle file uploads over 50MB?
- **Action Items:** John - Investigate API file upload capacity | deadline: Thursday

---

### MM-024: Multi-Part Statement

**Transcript:**

John: Sarah will handle the frontend, Mike takes the backend, and Priya owns testing for this sprint.

**Expected Results:**

- **Action Items:** Sarah - Handle frontend | Mike - Handle backend | Priya - Own testing (3 separate items)

---

## 2. ACTION ITEMS ONLY TEMPLATE

### AI-020: Full Action Items Extraction

**Transcript:**

John: Let's quickly go through who's doing what this week.
Sarah: I'll finish the API documentation by Wednesday. But I'm blocked on the database schema - waiting for Mike to finalize it.
Mike: I'll have the schema done by tomorrow EOD. Then Priya can start the migration scripts.
Priya: Got it. I'll start migration once Mike delivers the schema. Also, the staging server is down - I can't test anything until IT fixes it.
John: I'll escalate the staging server issue to IT today. Priya, once it's back, run the full regression suite.
Sarah: One more - the client wants the demo moved to Friday instead of Thursday. John, can you confirm with them?
John: I'll confirm the demo date with the client today.

**Expected Results:**

- **Action Items:**
  - Sarah: Finish API documentation | deadline: Wednesday | dependency: Mike's DB schema
  - Mike: Finalize database schema | deadline: tomorrow EOD
  - Priya: Start migration scripts | dependency: Mike's schema delivery
  - Priya: Run full regression suite | dependency: staging server restored
  - John: Escalate staging server issue to IT | deadline: today
  - John: Confirm demo date with client | deadline: today
- **Blockers:**
  - Sarah blocked on DB schema (waiting for Mike)
  - Priya blocked on staging server (waiting for IT)
- **Dependencies:**
  - Priya's migration depends on Mike's schema
  - Priya's testing depends on staging server
  - Sarah's API docs depend on DB schema

---

### AI-021: Delegation and Volunteering

**Transcript:**

John: Someone needs to handle the security audit.
Mike: I can take that.
John: Great. Sarah, tell Priya to update the test suite when Mike's done.
Sarah: Will do.

**Expected Results:**

- **Action Items:**
  - Mike: Handle security audit (volunteered)
  - Priya: Update test suite (delegated via Sarah, depends on Mike's audit)

---

### AI-022: Cancellation / Reassignment

**Transcript:**

John: Sarah, you handle the deployment.
Sarah: Actually, I'm overloaded this week.
John: Okay, Mike you take the deployment instead.
Mike: Got it.

**Expected Results:**

- **Action Items:**
  - Mike: Handle deployment (Sarah was reassigned - only Mike's item exists)
  - Sarah's item does NOT appear (cancelled)

---

## 3. SPRINT / BACKLOG GROOMING TEMPLATE

### SG-020: Full Sprint Grooming

**Transcript:**

John: Sprint goal this iteration is to complete the checkout flow end-to-end so beta users can make purchases.
Sarah: First story - as a customer, I want to add items to cart so I can purchase multiple products. I'd say that's a 5-pointer.
Mike: I think it's an 8. The cart needs to handle inventory checks in real-time.
Sarah: Fair point. Let's go with 8.
John: Next - as a customer, I want to pay with credit card so I can complete my purchase. Estimate?
Priya: That depends on the payment gateway integration. We can't start until the Stripe API keys are provisioned.
Mike: I'd say 13 points. It's complex with error handling, retries, and webhooks.
John: Agreed. 13 it is. Any risks?
Sarah: If Stripe takes more than 3 days to provision keys, we won't finish the sprint.
John: Good call. Let's flag that. Next sprint we'll tackle order confirmation emails.

**Expected Results:**

- **Sprint Goal:** Complete checkout flow end-to-end so beta users can make purchases
- **User Stories:**
  - As a customer, I want to add items to cart, so that I can purchase multiple products
  - As a customer, I want to pay with credit card, so that I can complete my purchase
- **Estimates:**
  - Add to cart: 8 points (debated 5 vs 8, settled on 8 due to real-time inventory)
  - Credit card payment: 13 points (complex error handling, retries, webhooks)
- **Dependencies:**
  - Payment story depends on Stripe API key provisioning
- **Decisions:**
  - Cart story estimated at 8 points
  - Payment story estimated at 13 points
- **Risks:**
  - Stripe key provisioning delay (>3 days) may prevent sprint completion
- **Next Steps:**
  - Order confirmation emails in next sprint

---

### SG-021: Estimation Disagreement

**Transcript:**

Sarah: I think the search feature is a 3.
Mike: No way, it's at least an 8 with the filtering and pagination.
John: Let's compromise at 5 and see how it goes.

**Expected Results:**

- **Estimates:** Search feature: 5 points (notes: Disagreement - Sarah said 3, Mike said 8, compromised at 5)
- **Decisions:** Search feature estimated at 5 points (compromise)

---

### SG-022: Dependency Chain

**Transcript:**

John: The payment page can't start until the cart is done. And the order confirmation depends on payment being complete.
Sarah: So it's cart, then payment, then confirmation - in sequence.
John: Exactly. No parallelization here.

**Expected Results:**

- **Dependencies:**
  - Payment page depends on cart completion
  - Order confirmation depends on payment completion
- **Decisions:** Cart -> Payment -> Confirmation must be sequential (no parallelization)

---

## 4. STAKEHOLDER INTERVIEW TEMPLATE

### SI-020: Full Stakeholder Interview

**Transcript:**

John: Thanks for meeting with us. Can you walk us through how your team currently handles employee onboarding?
Lisa: Sure. Right now when a new hire starts, HR manually creates accounts in five different systems - email, Slack, Jira, VPN, and the benefits portal. It takes about 2 hours per employee.
John: What's the biggest pain point in that process?
Lisa: The manual data entry. We make mistakes - wrong email formats, typos in names. Last month, three new hires couldn't log in on their first day because of typos.
John: What would success look like for you?
Lisa: Ideally, one form submission that auto-provisions everything. HR enters data once, and all five systems get set up within 15 minutes. Zero typos because it's automated.
John: Any constraints we should know about?
Lisa: Budget is limited to 30K dollars for this phase. And we can't touch the VPN system - IT won't allow API access to it. Also, we're on a legacy payroll system - ADP Workforce - that might be tricky to integrate.
John: Is there a deadline?
Lisa: We're hiring 50 people in September. This needs to be live by August 15.

**Expected Results:**

- **Stakeholders:**
  - Lisa | HR | Employee onboarding | Influence: high
  - John | Interviewer/BA
- **Pain Points:**
  - Manual account creation across 5 systems takes 2 hours per employee | Lisa | Productivity loss
  - Typos in manual data entry causing login failures on first day (3 incidents last month) | Lisa | Employee experience impact
- **Current Workflows:**
  - Employee onboarding: HR manually creates accounts in email, Slack, Jira, VPN, benefits portal per new hire
- **Desired Outcomes:**
  - One form submission auto-provisions all systems within 15 minutes
  - Zero typos through automation
- **Requirements:**
  - Auto-provision accounts across 5 systems from single form submission | functional
  - Complete provisioning within 15 minutes | non_functional
- **Constraints:**
  - Budget: $30K for this phase
  - Cannot access VPN system (no API access, IT restriction)
  - Legacy payroll system (ADP Workforce) may be difficult to integrate
  - Must be live by August 15 (50 hires in September)

---

### SI-021: Pain Point vs Desired Outcome

**Transcript:**

Lisa: Every time someone leaves, we forget to revoke their access. Last quarter we found 12 ex-employees still had Jira access.
John: So the desired outcome would be automatic deprovisioning?
Lisa: Exactly. When someone is marked as terminated in ADP, all access should be revoked within 1 hour.

**Expected Results:**

- **Pain Points:** Forgetting to revoke access for departing employees (12 ex-employees still had Jira access last quarter)
- **Desired Outcomes:** Automatic deprovisioning within 1 hour of ADP termination status
- **Requirements:** Auto-revoke all system access within 1 hour when employee marked terminated in ADP

---

### SI-022: Constraint vs Preference

**Transcript:**

Lisa: We absolutely cannot use any cloud storage outside of AWS. Compliance requires it.
Lisa: We'd prefer to use React for the frontend, but it's not a hard requirement.

**Expected Results:**

- **Constraints:** Must use AWS only for cloud storage (compliance requirement)
- (React preference is NOT a constraint - it's a preference, do not extract)

---

## 5. UAT / DEMO FEEDBACK TEMPLATE

### UAT-020: Full Demo Feedback

**Transcript:**

John: Let me walk you through what we've built. Here's the employee onboarding form.
Lisa: Oh nice. The layout is clean. I like the auto-complete on the department field.
John: And when you submit, it provisions Slack and Jira automatically. Let me show you.
Lisa: Wait - it's been spinning for 10 seconds. Is that normal?
John: Hmm, that seems slow. Let me note that.
Lisa: Also, the employee ID field - can we make it auto-generated instead of manual entry? We always mess that up.
Mark: I agree with Lisa. Auto-generate the ID. Also, can we add a bulk upload option? We sometimes onboard 10 people at once.
Lisa: Yes! Bulk upload would save us hours. That's more important than single entry honestly.
John: Good feedback. Anything else?
Lisa: The confirmation email looks good. I'd say the basic flow is approved - we can go live with single entry first. But the bulk upload needs to come in Phase 2.
Mark: Agreed. Looks good overall. The slow provisioning needs to be fixed before go-live though.

**Expected Results:**

- **Features Demonstrated:**
  - Employee onboarding form
  - Auto-complete on department field
  - Slack/Jira auto-provisioning
  - Confirmation email
- **Feedback:**
  - Layout is clean | Lisa | positive
  - Auto-complete on department liked | Lisa | positive
  - Provisioning takes ~10 seconds (slow) | Lisa | negative
  - Confirmation email looks good | Lisa | positive
  - Looks good overall | Mark | positive
- **Change Requests:**
  - Auto-generate employee ID instead of manual entry | Enhancement | P2 | Lisa
  - Add bulk upload option for batch onboarding | New Feature | P2 | Mark/Lisa
- **Bugs:**
  - Provisioning spinning for ~10 seconds | Major | Submit onboarding form
- **Approvals:**
  - Basic single-entry flow approved for go-live
  - Confirmation email approved
- **Action Items:**
  - Fix slow provisioning before go-live | P1
  - Plan bulk upload feature for Phase 2 | P3

---

### UAT-021: Bug vs Change Request

**Transcript:**

Lisa: When I click Submit, nothing happens. Is it broken?
John: Oh yes, that's a bug. The button handler isn't connected.
Lisa: Also, can you change the submit button color to blue? Our brand color is blue.

**Expected Results:**

- **Bugs:** Submit button unresponsive (handler not connected) | Critical
- **Change Requests:** Change submit button color to blue (brand alignment) | Enhancement | P4
- (Note: Button not working = bug. Color preference = change request. Different sections.)

---

### UAT-022: Approval vs Conditional Approval

**Transcript:**

Lisa: The reports module looks great. Approved.
Mark: The dashboard is good but I want the date filter fixed before I sign off.

**Expected Results:**

- **Approvals:** Reports module approved by Lisa
- **Action Items:** Fix date filter on dashboard (needed for Mark's sign-off) | P2
- (Note: Mark did NOT approve. Conditional = action item, not approval.)

---

### UAT-023: Positive Feedback vs Change Request

**Transcript:**

Lisa: I love the search functionality. Very fast.
Lisa: But can you add a filter by date range? That would make it even better.

**Expected Results:**

- **Feedback:** Search functionality is very fast | Lisa | positive
- **Change Requests:** Add date range filter to search | Enhancement | P3 | Lisa
- (Note: "I love X" = feedback. "Can you add Y" = change request. Different sections.)

---

## EDGE CASES (All Templates)

### EDGE-001: Empty Transcript (No Actionable Content)

**Transcript:**

John: Hey everyone, how was your weekend?
Sarah: Good, went hiking.
Mike: Nice weather today.
John: Alright, let's wrap up. See you tomorrow.

**Expected Results:**

- ALL sections should be empty (or summary only: "Brief informal conversation with no actionable items discussed")
- Do NOT invent action items, decisions, or requirements from small talk

---

### EDGE-002: Single Speaker, All Content

**Transcript:**

John: So here's the plan. Budget is 50 lakh. Deadline is August 1. We'll use React for frontend and Node for backend. Sarah handles design, Mike does API, I'll manage the project. The risk is we might not get the AWS credentials on time. Let's assume the client will provide test data by next week.

**Expected Results (Meeting Minutes):**

- **Decisions:** Use React for frontend, Node for backend
- **Action Items:** Sarah - design | Mike - API | John - project management
- **Constraints:** Budget 50 lakh, Deadline August 1
- **Risks:** AWS credentials may not arrive on time
- **Assumptions:** Client will provide test data by next week
