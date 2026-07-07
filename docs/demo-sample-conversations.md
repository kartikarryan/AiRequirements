# MeetScribe — Sample Meeting Conversations for Demo

Use these scripts to record audio for testing. Read them aloud with a colleague (or alone, playing both parts). Each is designed to produce impressive extraction results with the matching template.

---

## 1. Sprint Planning (Template: Sprint / Backlog Grooming)

**Duration:** 5 minutes
**Speakers:** Karthik (Scrum Master), Sarah (Backend Dev), Mike (Frontend Dev)

---

**Karthik:** Alright team, let's plan Sprint 14. Our sprint goal is to deliver the complete user authentication flow so that beta users can register and login by end of sprint. We have 40 story points of capacity this sprint — Sarah and Mike are both available full-time.

**Sarah:** Sounds good. So from the backlog, the first story is: As a new user, I want to register with my email and password so that I can create an account. I'd estimate that at 5 points.

**Mike:** Agreed, 5 points. For the frontend form, I'll need the API contract from Sarah first though.

**Karthik:** OK, so there's a dependency — Mike's frontend work depends on Sarah's API being ready. Sarah, when can you have the registration endpoint done?

**Sarah:** I can have it ready by Wednesday. The second story is: As a registered user, I want to login with my credentials so that I can access my dashboard. I'd say 8 points because we need JWT token handling, refresh tokens, and session management.

**Mike:** Initially I was thinking 5, but yeah with the token refresh logic on the frontend, let's go with 8.

**Karthik:** Alright, 8 points agreed. What about the password reset flow?

**Sarah:** As a user, I want to reset my password via email so that I can recover my account if I forget my credentials. That's another 5 points. Acceptance criteria would be: user receives a reset link within 60 seconds, link expires after 24 hours, and the new password must meet our complexity requirements.

**Mike:** For the frontend, my part is just the form — maybe 3 points. So combined 8. Actually let's say 8 for the whole thing.

**Karthik:** OK. Any blockers?

**Sarah:** Yes — I don't have access to the email service credentials yet. DevOps needs to provision the SendGrid API key. I can't start the password reset email feature until I get those credentials.

**Karthik:** That's a blocker. I'll escalate that today. Mike, anything blocking you?

**Mike:** Not yet, but there's a risk — if the design team doesn't deliver the login page mockups by Monday, I'll have to guess the layout and we might need rework.

**Karthik:** Good call. I'll ping the design team today. Let me also note — we're carrying over the "remember me" checkbox story from last sprint. As a user, I want to stay logged in on trusted devices so that I don't have to login every time. That was estimated at 3 points.

**Sarah:** Right, that's carry-over. I'll handle the backend token extension logic.

**Karthik:** So total committed: 5 + 8 + 8 + 3 = 24 points out of 40 capacity. We have room. Any decisions before we wrap?

**Mike:** Let's go with OAuth for third-party login instead of building our own social login. It's more secure and faster to implement.

**Karthik:** Agreed — decision made: we'll use OAuth 2.0 for any future social login rather than custom implementation. Sarah, one action item — can you document the API contracts for both registration and login endpoints and share them with Mike by end of day Tuesday?

**Sarah:** Sure, I'll have that done by Tuesday evening.

**Karthik:** Great. Next steps: I'll set up the sprint board, escalate the SendGrid blocker, and check with design on the mockups. Sprint 14 starts now. Let's go!

---

## 2. Stakeholder Interview (Template: Stakeholder Interview)

**Duration:** 7 minutes
**Speakers:** Karthik (BA), Lisa (HR Manager), Raj (IT Admin)

---

**Karthik:** Thanks for joining, Lisa and Raj. Today I want to understand your current employee onboarding process and where the pain points are. Lisa, can you walk me through what happens when a new employee joins?

**Lisa:** Sure. So when we hire someone, I get a signed offer letter. Then I have to manually create their accounts in five different systems — corporate email, Slack, Jira, VPN access, and the benefits portal. Each one has a different admin panel. It takes me about 2 hours per new hire.

**Karthik:** Two hours per person — and how many new hires do you process per month?

**Lisa:** About 8 to 10 on average. So that's roughly 20 hours a month just on account creation. And the worst part is typos. Last month, three new hires couldn't log in on their first day because I mistyped their email address in one of the systems.

**Raj:** I can confirm that. I get tickets every first Monday of the month — "new employee can't access email" or "VPN not working." Usually it's a typo in the provisioning. I spend about 30 minutes fixing each one.

**Karthik:** So the current workflow is: HR receives offer letter, manually creates accounts in 5 systems, and IT fixes errors afterward. What's the impact of these errors beyond the time?

**Lisa:** It's embarrassing, honestly. The new hire's manager calls me frustrated. The employee feels like we're disorganized. First impression matters, and we're failing at it.

**Raj:** From IT's side, it's also a security risk. When someone leaves, Lisa has to remember to disable all five accounts. Last quarter we found two former employees still had active VPN access three weeks after their exit date.

**Karthik:** That's serious. What would the ideal state look like for you?

**Lisa:** One form. I fill in the employee's name, email, department, and role — and all five systems get provisioned automatically within 15 minutes. Zero typos because it's automated. And when they leave, one click deactivates everything.

**Raj:** From my side, I want audit logs. Who was provisioned, when, by whom. And automatic deprovisioning — when HR marks someone as terminated in the HRIS, all access gets revoked within one hour, not three days.

**Karthik:** What about budget and timeline for this project?

**Lisa:** We have an approved budget of 50 lakh rupees. The project needs to be completed within 6 months because we have a compliance audit in January.

**Karthik:** Understood. Any technical constraints?

**Raj:** Yes — we cannot use any cloud service outside of AWS. Our data residency policy requires all employee data to stay within Indian AWS regions. Also, the system must integrate with our existing Oracle HR database — no migration allowed.

**Karthik:** Are there any assumptions we should validate?

**Raj:** We're assuming all five target systems have APIs available for automated provisioning. I'm fairly confident about email and Slack, but I haven't verified VPN and the benefits portal.

**Karthik:** Good — that's a risk. If VPN or benefits portal don't have APIs, our automation approach might need a different strategy for those systems. Let me capture that.

**Lisa:** One more thing — the accounts payable team is also impacted. They process vendor payments, and right now vendors wait 30 days because the invoice approval workflow is entirely paper-based. If we're automating onboarding, they'll want to know if invoice automation is next.

**Karthik:** Noted — the accounts payable team and vendors are stakeholders too, even though they're not in this meeting. Any final requirements?

**Raj:** The system must support SSO — single sign-on. And it needs 99.9% uptime because if it's down, no one can get provisioned.

**Karthik:** Got it. Let me summarize the key requirements: automated multi-system provisioning, automatic deprovisioning on termination, audit logging, SSO support, 99.9% uptime, AWS-only infrastructure, Oracle integration, and a 6-month timeline within 50 lakh budget. I'll document all of this and share a requirements doc by Thursday. Thank you both.

---

## 3. UAT / Demo Feedback (Template: UAT / Demo Feedback)

**Duration:** 5 minutes
**Speakers:** Karthik (Developer), Priya (QA Lead), Arun (Product Owner)

---

**Karthik:** Thanks for joining the demo. Today I'll walk you through the employee onboarding module we've built. Let me share my screen. First, here's the new employee registration form.

**Priya:** OK, the form layout looks clean. I like the auto-complete on the department field — that's smooth.

**Arun:** Agreed, the UI is good. Can you show me what happens when you submit?

**Karthik:** Sure. I'll fill in a test employee — John Smith, Engineering department, Backend Developer role. Click submit... and you can see it's provisioning across all five systems. Email created, Slack invited, Jira access granted, VPN configured, and benefits portal setup. All done in about 12 seconds.

**Arun:** That's impressive. The confirmation email looks good too. Approved — this basic flow is ready to ship.

**Priya:** Wait — I notice the employee ID field is manually entered. Can we make that auto-generated instead? Every company I've worked at auto-generates employee IDs.

**Arun:** Good point. Yes, let's add auto-generation. That's a change request — make the employee ID auto-generated based on the department code plus a sequence number.

**Karthik:** Noted. I'll add that to the backlog.

**Priya:** Also, I tried submitting without filling in the department field and it just shows a generic "validation error" message. It should say "Department is required" specifically.

**Karthik:** You're right, that's a bug. I'll fix the validation messages.

**Arun:** One more thing — when I click the "View All Employees" button, the page takes about 8 seconds to load. That's too slow for production.

**Priya:** I can confirm that. The table is loading without pagination — it's pulling all 500 test records at once. That's probably the database query loading everything without limit.

**Karthik:** Good catch. I'll add pagination and optimize the query.

**Arun:** The deprovisioning flow — can you show that?

**Karthik:** Sure. If I go to an active employee and click "Terminate"... it asks for confirmation... and then revokes all access. Done in 6 seconds.

**Arun:** Perfect. The deprovisioning is approved as-is. No changes needed there.

**Priya:** Can you add a "Bulk Upload" option? HR sometimes needs to onboard 10 people at once during campus hiring season. Doing it one by one would be painful.

**Arun:** That's a good suggestion. We'll consider it for the next sprint. Not critical for launch but definitely useful. Let me note that as a deferred feature.

**Karthik:** Makes sense. So to summarize — the basic onboarding flow and deprovisioning are approved. Three action items: fix validation messages by Friday, add employee ID auto-generation, and add pagination to the employee list. Bulk upload is deferred to next sprint.

**Arun:** Correct. Good work, Karthik. Let's plan to go live next Wednesday after these fixes.

---

## 4. Product Discovery / General Meeting (Template: Meeting Minutes)

**Duration:** 4 minutes
**Speakers:** Karthik (PM), Dev (Tech Lead), Anita (Designer)

---

**Karthik:** Let's discuss the notification system for our app. The main agenda today is deciding what types of notifications we need and how to implement them.

**Dev:** So we need to support three channels: in-app notifications, email, and push notifications for mobile.

**Anita:** From a design perspective, I've been looking at how Slack and Linear handle notifications. I think we should have a notification center — a bell icon in the top bar that shows unread count.

**Karthik:** Agreed. Let me capture the key topics: notification channels, notification center UI, and user preferences for opt-in/opt-out.

**Dev:** The technical decision we need to make is: do we use a third-party service like Firebase Cloud Messaging, or build our own notification infrastructure?

**Karthik:** What's the trade-off?

**Dev:** Firebase is faster to implement — maybe 2 weeks. Building our own gives us more control but takes 6-8 weeks. Given our timeline, I'd recommend Firebase for push notifications and our own service for in-app and email since we already have SendGrid.

**Anita:** That makes sense to me. Let's not reinvent the wheel for push notifications.

**Karthik:** OK, decision made — we'll use Firebase for push notifications and keep our existing SendGrid setup for email. In-app notifications will be a custom implementation in our database.

**Dev:** One constraint — the mobile app needs to support iOS 15+ and Android 12+. Firebase works with both, so we're fine there.

**Karthik:** Good. Anita, can you create the notification center mockups by next Wednesday?

**Anita:** Sure, I'll have wireframes ready by Wednesday. I'll include the bell icon, the dropdown panel, and the settings page for notification preferences.

**Karthik:** Dev, can you investigate the Firebase setup and share a technical spec by Thursday?

**Dev:** Will do. One open question though — do we need to support notification grouping? Like, if someone gets 10 comments on their post, do we show 10 separate notifications or one grouped notification saying "10 new comments"?

**Karthik:** Good question. Let's discuss that when Anita has the mockups ready — we'll decide based on the UX. For now, I'll leave it as an open question.

**Dev:** Also, there's a risk — if we go with Firebase, we're depending on Google's infrastructure. If they have an outage, our push notifications stop. We should have a fallback plan.

**Karthik:** Noted as a risk. Mitigation could be email as a fallback channel. Let's revisit that during implementation. Next steps: Anita delivers mockups by Wednesday, Dev delivers Firebase technical spec by Thursday, and we reconvene Friday to finalize the approach. Thanks everyone.

---

## 5. Quick Action Items Meeting (Template: Action Items Only)

**Duration:** 3 minutes
**Speakers:** Karthik (Lead), Sarah (Dev), Mike (Dev)

---

**Karthik:** Quick standup — let's get aligned on this week's deliverables. Sarah, where are you on the payment integration?

**Sarah:** I finished the Stripe checkout flow yesterday. Today I'm working on webhook handling for payment confirmations. Should be done by tomorrow. One blocker though — I need the Stripe test API keys. The ones we have expired last week.

**Karthik:** Got it. I'll get you new test keys from the finance team today. Mike, what about the dashboard?

**Mike:** The dashboard charts are done. I'm stuck on the date filter — the API doesn't support date range queries yet. Sarah, is that something you can add?

**Sarah:** Yeah, I'll add date range parameters to the analytics endpoint. I can do that Thursday after the payment work is done.

**Karthik:** Perfect. Let's also decide — should the dashboard refresh automatically or require a manual refresh button?

**Mike:** Auto-refresh every 30 seconds. Users expect real-time data on a dashboard.

**Sarah:** Agreed. Thirty seconds is reasonable without overwhelming the server.

**Karthik:** Decision made — auto-refresh every 30 seconds. One more thing — the QA team found a critical bug. The export PDF button generates a blank file when there are more than 50 rows. Mike, can you investigate?

**Mike:** I'll look into it today. Probably a memory issue with the PDF library.

**Karthik:** Make it priority one — customers are reporting it. OK next steps: I'll get Stripe keys for Sarah, Sarah finishes webhooks tomorrow then adds date range API Thursday, Mike investigates the PDF bug today, and we reconvene Thursday afternoon for a quick check. Done — 3 minutes, that's a record.

---

## How to Record These

1. **Best quality:** Record with a colleague reading the other parts. Use your phone or laptop mic in a quiet room.
2. **Solo option:** Read all parts yourself, changing your tone/pitch slightly for different speakers.
3. **Format:** Save as MP3 or WAV. 
4. **File size:** These conversations produce files of 2-5 MB each — well within the 200 MB upload limit.

## Expected Output Quality

| Conversation | Template | Expected Extraction Highlights |
|---|---|---|
| Sprint Planning | Sprint / Backlog Grooming | Sprint goal, 4 user stories with points, 1 blocker, 1 risk, 1 decision, dependency |
| Stakeholder Interview | Stakeholder Interview | 4 pain points with numbers, 2 workflows, 6 requirements, budget + timeline constraints |
| UAT Demo | UAT / Demo Feedback | 5 feedback items, 2 change requests, 2 bugs, 2 approvals, 3 action items |
| Product Discovery | Meeting Minutes | 3 key topics, 2 decisions, 3 action items, 1 constraint, 1 open question, 1 risk |
| Quick Standup | Action Items Only | 5 action items with assignees, 1 blocker, 1 decision, dependencies |
