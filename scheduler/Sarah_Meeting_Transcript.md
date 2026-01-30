# Sarah Scheduling Meeting Transcript
## January 15, 2026 - Spencer & Sarah

---

## Summary

### Current Support Team Status
- Support team has been very busy since returning from break
- Auth0 issues remain challenging - clients continue copying the auth link instead of their actual link
- System users temporarily lost the ability to change their email, causing many support cases
- Camps are ramping up with setup questions, particularly around payment configuration

### Current Scheduling Process

Sarah manages support team scheduling using three main systems:

1. **Spreadsheets**: Non-summer and summer schedules for high-level planning
2. **Sling**: Daily hourly schedules for phone, chat, and ticket coverage (what the team primarily uses)
3. **Google Calendar**: Company-wide visibility for meetings and PTO (only Sarah's team uses Sling)
4. **Rippling**: PTO request submissions

**Weekly scheduling workflow:**
- Sarah creates schedules 1-2 weeks in advance
- Cross-references skeleton schedule, Google Calendar meetings, and PTO requests
- Manually fills out hourly schedules in Sling using saved templates
- For last-minute changes (sick days, appointments), unpublishes affected shifts and manually adjusts

### Main Pain Point: Manual Updates
- Any PTO request requires updates in 2-3 places
- Future dates aren't pre-filled in Sling, requiring the spreadsheet for zoomed-out planning
- Scheduling described as taking up more time than desired - **"My job is not a beach"**

### Summer Schedule Complexity

Summer scheduling is significantly more complex due to:

- **7-day support coverage** with on-call rotation
- **Strict scheduling rules:**
  - No more than 5 consecutive working days
  - No more than 5 days in any 7-day week
  - Only work one of two working holidays (Juneteenth and July 4th)
  - Only 4 working days in holiday weeks
- **On-call optimization**: Only assigned on-call for nights when working the surrounding days
- **"Popcorn days"**: Extra days off (not PTO) to satisfy 5-day constraints, tracked to ensure even distribution
- **Load balancing across team:**
  - Even distribution of weekend days
  - Even distribution of holidays
  - Even distribution of on-call shifts
  - Even distribution of early/mid/late shifts (considering time zones)

Sarah attempted to use ChatGPT for this last year but AI capabilities have significantly improved since then.

### Key Quote from Sarah

> "You know how Ken's job is beach? My job is not scheduling, but it's kind of scheduling. This takes up more of my time than I would like it to. So any sort of solution would be amazing."

---

## Full Transcript

Oh. That's a handy way of doing that. Thank you. Okay. Thank you. Okay. Thank you. Hey Sarah. Hi, Spencer. Sorry I'm late.

Oh, you're just fine. It's no problem whatsoever. How are you doing? I think I've met you a couple of times. I've seen you in demo, I believe, like the demos.

I've tried to go a couple times, but yeah, doing good. I manage the support team. I think you know that, but we've just been like really busy with support since coming back from break.

Oh yeah, I bet. Is Auth0 stuff, is that calming down now?

For the most part, there's a couple outstanding things that are still causing a lot of cases. Clients keep copying. the auth link instead of their actual link. Sometimes it's hard to explain to them why it doesn't work. So we've still gotten quite a few of those and it's just really hard to like, Idiot proof it for lack of a better term.

Yes, I was on a, so I designed a lot of version two of Alter Camp. So we've had lots of discussions on idiot proofing and like, I love the camps. I do. I love camps. They're not... You shouldn't trust them with technology. You just shouldn't. But we have to, but you shouldn't. It's not their thing. They love people. That's what they're good at.

Exactly. And they're great at people. I do. But yeah, so the links are still there. And then... We took away the ability for system users to change their email. I don't know if you knew about that one. Oh, man. And so we're going to give that back now. Okay. But that's been a lot of cases as well.

Oh, I can definitely see that.

Yeah, because they for the interim they had to, we were suggesting they inactivate the user, create another user but then that's intentional duplicates and they couldn't merge them because merging was changing the email so it wouldn't let them. So we're working on resolving that as well. Otherwise, it's really just camp starting to ramp up. It's a lot of setup questions, setting up payments correctly.

Yeah.

Yeah, that's kind of our flow state as well. Even though most camps are kind of set up, but they wait last minute and it's all their... Their emergency, they think, is our emergency. And so even though...

Oh, yes. All right.

So, yeah, so... And the AI roadshow or roadmap item was kind of put in a while ago. We were kind of looking at it. Right now, with the whole thing with Melissa, things are kind of in flux right now. Yeah. I'm like, let's just keep continuing with this. For me and Elliot, we were looking and we're talking at this and what we kind of saw this is like, Um... A way, like kind of a win-win situation is because as technology, part of my job, the one specifically my job is I'm an AI solutions engineer.

My job is really to provide like ways in which AI can solve problems. I'm trying to solve problems with AI as part of it. But then also one of the things that we do is really, I guess, looking at Okay, where's AI going in the software industry and like what impacts and changes and is this going to have? And so we're... What we kind of do a lot of, what I do a lot of specifically is kind of like prototyping and showing like, okay, this is something that AI can do in software.

And so one of the things that where AI is at now is really the ability to... It's so good at kind of coding kind of on the fly and what, you know,Excuse me. a potential trend, what we're kind of starting to see in the very, very, very early stages is it's at least at the ability where it can actually create features on demand. And so we're like, okay, what does this actually look like? Like if we create an environment where we open it up to you, and so we get the app going, so we can kind of get a full kind of app, a scheduling thing up and going for you, that is kind of AI native.

And so AI, You can use the app, you can do stuff manually, but if you just want the AI to do it for you, that's... That's kind of what we see, how that's working. But then as part of that is, I could say, if you need a feature, a new feature, or you have a bug or whatever, what we want to try to do is try to set it up so you can just tell the AI, hey, I have this bug, and the AI will just fix it for you.

That'd be kind of cool, right? That'd be kind of cool. And we think it's doable, but we don't know for sure until we actually try it and try to figure out the bugs. But that's kind of what... We're thinking of like, hey, maybe we can build you a tool that helps you out. And then we get a good use case of like, hey, this is maybe something we could consider for the future of our products. I don't know, but at least just gives us a test subject.

So I've got a bunch of different questions. I'm going to just ask you various different questions. And this is just going to help me build out potentially the functionality of the app if we go through with this. Mm-hmm. Parents who were like,I don't know what my job looks like right now. There's a lot that's changed, right? Like I do know my job is safe, but I just found out I also have a new boss.

And so we don't know right now. But I'm going to continue as things, what we thought things were going to go. Yeah. So currently in support and stuff like how, how do people, how are people currently requesting time off?

Time off requests.

Yeah, if that's relevant.

Yes, it is. Is it okay if I zoom out and just start talking at you for a bit about all of the scheduling things?

Yes, I should say I do have transcripts going. And so, and then I, yes. So we can do that as well. So you can just, yeah, feel free to talk at me.

Okay, I'm going to share my screen and show you what my life is right now, Spencer. So my life exists in three spreadsheets for the most part. That was the summer schedule.

Okay, all right.

That's still nice. We have non-summer schedule and regular summer schedule. So if we start with the zoom out, this is how I... This is how I skeleton for the non-summer, where I just keep track of weeks, how many people I have, and if they're going to be on an early, mid, or late rotation. This is more important when we've had periods of time where we've done more of a rotation of everybody rotates through mid and late, or vice versa, everybody rotates through early.

Right now, we're pretty consistent. on PTO this week. I can't have two minutes. I can only have one. This, I then go out to daze. So for days, this is where I'm keeping track of people and what shift they're on. So that if I do get a PTO request, so like if Bennett requests PTO this day, then I move her down and I know, okay, I need to reallocate for late shift.

Recording in progress.

Sorry, just hit recording. Okay. I realize I should also record.

So this is the daily view. If someone were to request PTO, this is just a zoomed out. This is a zoomed out. ahead of time schedule so I can see if I need to move someone to another shift to a late shift or a mid shift. This then translates to sling. Sling is a daily hourly schedule so that we can make sure we have appropriate coverage for phones versus chat versus ticket coverage. And we also put meetings on here.

This is because we're working remotely for visibility for the team so they know what they're doing throughout the day. um I guess I should also bring up Google Calendar. Oh, I did. I also live in Google Calendar. The thing is, my team does not live in Google Calendar. They really live in Sling. Sling is what they're looking at. Oh, okay. But I go back and forth with Google Calendar. And so this is where I document what's going on for the support team.

So we have the support team calendar. So anything big that comes up like a meeting or our daily stand up or PTO, we do still have this all in Google Calendar. So it's visible across the company because only my team is in Sling for that hourly view. So... Right now, what I do is... Ideally two weeks before, but right now it's been one week before. I come into Sling and I do the schedule. So right now, Monday, well, we're off on Monday.

So right now, Tuesday is blank. I can add a template. Let's see, do I have a Tuesday template right now? These are all templates that I've made and saved. Here's a Tuesday template. Then I am cross-referencing this with my skeleton of who's on what shift. and with any meetings that have popped up because if other teams are trying to schedule meetings with the support team, they just add them to this Google Calendar.

So then I'm the manual person and I come in and I look at both of these things and I fill out their hourly schedule and I do that one to two weeks in advance. This is the overall process. Let's talk about request offs. If they request time off, They are expected to put the request in rippling now. And so that comes... That sends me or Sam a notification that they requested time off. We come in and if it's in advance, so it's not on Sling yet, we just do it in here as a visual of let's denote that they're going to be on PTO that week.

And we put it on Google Calendar as a visual, they'll be on PTO. And then we request it. If it's something last minute, it's more manual where, for example, yesterday we had a couple of people that were sick. So they like Zachary just told us before his shift that he was going to be out for the day. So we unpublished his sling and then we made manual adjustments to make sure we still had appropriate coverage.

Then like Afton had to go home early, we unpublished her shifts and made any additional adjustments that were needed to make sure there was appropriate coverage. Okay. If it's something in advance that's not a full day, like I'm just going to be out for a two-hour appointment, Our process is they make a Google Calendar event like these appointments up here. And then we, again, just put it in sling or I put it in sling when the week comes up.

Okay. Do you want to hear about the summer schedule?

Yes. Yeah. Anything that's helpful? I guess for first, yes, this is all helpful. What I, some questions before we get even deeper is, so, yeah. I want to make sure... Whatever solution we come up with, one, is the less intrusive to... Uh, We want to keep the good stuff and fix the bad stuff, right? And so I don't, and so you guys do have a process. There's a lot of things where it's, well, I guess what I want to know specifically, what helps me is like in your current process, like, so what you've shown me so far, what doesn't work for you at all?

Like what drives you up a wall? What do you desperately wish was fixed, I guess, about like your current process of how things work? We understand.

Yeah, I think it's just... The manual aspect of it. The fact that... If a PTO request comes in, I'm updating it in two to three places. Like I'm updating it in two places. And then when I do this, I also have to cross-reference to make sure it's correct in Sling. Okay.

So my question with that is, so why are you updating it in two places rather than just updating it in Sling?

Um. I think just because the future dates aren't filled in yet. So if we have PTO that's like weeks or months in advance, we're using it here as a zoomed out view of it. Okay. And putting it on. Also in Sling, I'm not sure if there's a way to denote that someone's off. I guess I could give them... I could potentially give them a shift of like create a shift of off. But we usually just leave them blank as opposed to putting a shift on here.

Okay.

So thoughts kind of with this is what we could do and what again whatever we do I just want to make sure that it's clear like you don't have to like accept right anything any solution we give you you know like we're going to put in time but even if you're like you know Spencer Elliot this is like junk I don't want to use this like you can definitely do that and like because we're still no matter like so this project in particular even if we're we can try to and be super helpful.

But I want to make it clear of like, even if we don't, we are still going to get value out of this because part of what we're doing, we're testing because like new ways to use AI to build software really, really quickly. So even if like we don't get you a result that you're happy with, like it just, just not like you're not wasting our time. Like, I just want to make sure you always feel free to give honest feedback.

Like if we provide you a solution and you're like, I actually, for my schedule, how would I'm doing better than what you just built? Like you are free to say that you don't, there's no obligation for you to accept anything that we build for you. With that being said, like would, if we were able to build you something that is, let's just say it's kind of a competitor to Sling, right? Like it's something, because there's something where it's like, so Sling, they have to build software that fits everything you know, thousands of different companies' workflow.

And so that's a very complicated thing that they have to do. Building something specific for Sarah and Sam, that's actually a lot easier, right? Like, because we don't need to do everything that Sling is doing. We just have to do what you need it to do. So it's actually an easier thing to build with AI. So I think, like, it may function a little bit differently, but, like, it's, you know, as I'm hearing things like, you need a zoomed-out view and you need this, and more particularly I think what AI does really well is we can build it so it's like you can just speak to it and you can be like here are my problems like you know Afton can only work at this time and Sarah whatever and then it can figure out these details and then once it can give its best shot and then you can just quickly correct it That's kind of what I'm envisioning.

Is that... That whole thing, does that sound all right to you?

Yeah, I think that sounds great. What I think would be really helpful with AI, and I'm not sure if this fits in right for... like building the app, but my biggest pain point is the summer schedule. Can I tell you a little bit about that?

Yes. Yeah.

So for the summer, we offer seven days of support. So currently, and we offer on-call support. Currently, this is all done manually by me or Sam. This is our very fancy spreadsheet of we have the number of CSRs that we had on a certain day last year. We have this autofills from the number that we're putting on for a given day. scheduling of no CSR should work. More than five days in a row. No CSR should work more than five days in a...

It's going to switch to Sunday to Saturday because that's how rippling is, but in a... seven day week, whatever we're considering a week, no more than five days. Um, and, And then there's two working holidays. So we actually, the Memorial Day used to be our working holiday, but we're actually going to be fully off. this year and have June 19th as our working holiday. But so the rules for So Juneteenth and 4th of July are in that week.

They may work the holiday, but they should only... Sorry, my thumb's up. Yeah, I get it.

But they should only work...

four days in the holiday week. So they should have a holiday off in that week. Um... And then for our on-call support, We used to just give them on call for a whole week, but we didn't like that they were then on call when they weren't expected to be working, like during the day or the next day. So we started doing this manually of they should only be on call if they are working. those days around their on-call nights.

Then we also get PTO requests from them because since we're offering seven days of support, rather than them taking PTO, if they're like, oh, I just really need the 22nd off, we can just make sure the 22nd is part of their weekend as opposed to them doing PTO on that day. So for the summer, we take all of their requests of what are the days that you are going to want to off. during the summer so we can put those in and then have them request PTO for anything That would take them out of working five days in a week.

Okay. Um, So there's a lot that goes into this. I think all of those if-thens would be great for AI to go through. And I've tried it with chatGBT, but this was last year. And I know we've come a long way since even last year. So we build this first. This is the days. Then similar to Sling, we have to build the shifts. So with our sheets, we have it auto-populate. So if they're on in a given day, their numbers in here, it auto populates here as they're on for the day.

And then we just drag and drop what shift they're working. So this one's pretty simple, honestly. And then... Our team breakdowns, this is what we're tracking for when we're making that days. We track how many weekend days they're working because we try to keep it spread evenly. We track which holiday they're working because they should only work one of the two working holidays. We track how many days of on-call they're doing because we try to spread it evenly.

Excuse me. And then we track how many of their shifts are early, mid or late, just again, to keep it kind of spread more towards their preferences, because we have a number of people on East Coast time, we try to keep them mostly early. We have a few people on Mountain time, we try to keep them mostly late, etc. Um, popcorn days are our invention to make sure we can hit no more than five days in a row.

No more than five days in a given week. There's just some weeks where they need an extra day off to make it work. So we just give them this extra day off and it's not ETO. I think in rippling, the Courtney said we're going to have to do these as like floating holidays for them. Again, we're just looking to make sure it's pretty evenly spread. It's not more than one or two, but like Al got three last year.

Okay. And then these are all of our known requests. Okay.

So I think in general, We can definitely... help you use AI to manage this better for this coming summer. Like I said, a year ago is just, it's a huge difference in terms of like AI advancement. And so a year ago, we didn't have like these models, didn't really have great reasoning built in. Reasoning now gives these models, because what you're asking is really, there's so many multi-part factors that AI has to consider.

AI can't really do that outside of like reasoning And so now these models have reasoning built in to their training. And so just, I mean, honestly, just because you explained this all to me very clearly, I've got this transcript. I can just kind of take that. I can actually work together, work on a prompt. And we can look at just getting AI to work inside your Excel sheet. There's options that we can do with that as well.

And so that way, if you're really comfortable in Excel, we can definitely look at... getting AI working with you in Excel, And just doing that for you. And so I think there's lots of options here, for sure. So I think we'll be able to help you. Again, there is a lot of things just up in the air right now. But I assume that whatever's going to come out is like, there's still, Camp Miner's going to want me and Elliot to help people solve problems with AI.

I think that's still going to happen. But either way, even if things change, I can definitely meet with you and just get you set up. in that way. So I think I definitely, this was very helpful for me. I've got, I'm really glad AI can transcribe everything and I can like, because there's lots of information. There's no way I could ever like get any what you just showed me, but I can break this down and we'll go from there.

So next steps, I'm off all next week. And so you probably won't hear from me. Maybe you might hear from Elliot, but not from me for next week. But I'll definitely, I would say week after next, I can definitely start cracking at some things. I will potentially, I'm going to try to solve the easiest problems first. And so I'm going to definitely look at your Excel sheet thing. If you can send me, if it's like, if there's no sensitive data on that, you can send me a link just so I can kind of copy that.

with cloud is probably the AI that we're going to be using. Okay. For this and so if it, If we need Claude to solve this problem for you, then we'll get you a license to Claude and we'll get you all set up there. But Claude is definitely better at this type of stuff. So I'll look at all that and then we'll... Yeah we'll go from there I'll communicate like hey Yeah I'll communicate from there Sounds great.

Did you see... The Barbie movie? This is really random.

Yes, I did. Actually, I really liked it.

You know how Ken's job is beach? My job is not scheduling, but it's kind of scheduling. This takes up... more of my time than I would like it to. So any sort of solution would be amazing.

Awesome. I think I can make you like your job better. I do. My job is not a beach. Yes. And I assumed that's a good illustration. That just looks like a nightmare to you. And I'm really glad that there are people that exist like you that can do what you just showed me that you do. Because I would quit within a day if someone told me It was my job. And so thank you for doing what you do. And yeah, you do beach very well.

Thank you.

I appreciate that. I just dropped the two spreadsheets in. The chat with Elliot. Let me know if you have any issues accessing them, but I think they're open to... They're open to Campminder LLC. I think you're in that group, but if you're not, let me know and I'll just share it with you directly. Okay, perfect.

All right. This is very helpful. I think, yeah, we'll... this coming summer will... will be better than last summer. I promise. We can do something for sure.

Thank you, Spencer.

Have a great PTO. Have a great PTO. Yeah, we'll see you guys later. Bye.
