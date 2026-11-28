# Axion

Heyya guys!! 👋🏼 What's up? Today, I'm going to show you my best masterpiece, Axion. So...what's Axion? 

## Huh?
Axion is my tiny microforum. I built it using pretty good tools (I'll say why I used these tools in a second), but the most important thing: Why is Axion called Axion?? Is it related to Axios? That JavaScript library for fetch requests? The answer is **NO.** It's called Axion because it's just a new name for my old project, Axe (which was a microforum strictly for carpenters, but Alex Wood (a good guy from the Discord server Developer Den) recommended renaming it to Axion, and then it won't be related to carpenters anymore, so you can use it if you aren't a carpenter)

## Why did I avoid using a framework like React?
They aren't bad frameworks tbh, they are actually good, but I skipped them for a few important reasons:
- I'm still learning modern frameworks. As a 13yo full-stack web developer, I still don't have lots of experience in different tools (I have 4y of experience in programming, but I still only know: cash-dom, Vanilla JS, Node.js, jQuery, MongoDB, Express, and a few other libraries to learn how to make production-grade apps, since I want to be a software engineer when I grow up)
- I won't accept vibecoding. Lots of people may just say *"Bro...AIs exist. Let ChatGPT handle everything related to React for YOU."* but that's totally trash. Not because getting help is bad, it clearly isn't, it just makes you a blind person. You won't understand what happens. You just accept whatever is being said. And you won't know if your code is good or bad. You just lack...the knowledge. And this is exactly why vibecoding is slowly killing engineers.
- I prefer keeping Axion lightweight. Yeah, most tutorials scream React. But they never tell you that it's overkill for a tiny community. Like, these guys don't think about scale. They just repeat.

## The best things I implemented in my Axion!!
### Handling the comment editing feature: 
Instead of using a basic `$ne` filter in MongoDB (which won't differentiate between whether the comment's document exists or isn't owned by the logged-in user), I used a Mongo aggregation pipeline:

1. Find a doc created by the current logged-in user where the `_id` matches the given comment ID (looking for how to say `_id` in an interview? "underscore-i-d" it is).
2. If found, update the content and timestamps only if the old content differs from the new content.
3. Check `matchedCount === 0`. If it's 0, we know that the doc wasn't found (or the user doesn't own it) and can throw a proper 404 error here.

Oh, and to end this cleanly, I included a changed field in the `res`(ponse. `res` is the most beautiful dev shorthand name 😭). Without more jokes (in this section only 😆), I set its value to `modifiedCount !== 0`. And while doing this, I also needed a way for the frontend to show an "(Edited)" badge on an updated comment card. 

I didn't want to rely on a single boolean like `isEdited: true` because it doesn't provide the metadata of when the update happened if I ever need it. I also rejected the idea of just comparing `createdAt` against `updatedAt` because a background script may modify the doc for maintenance.

So I came up with this idea: adding a third field called editedAt. For non-edited comments, it stays null. When a real edit happens, it stores the exact timestamp of that edit. Maybe I don't show the edit timestamp to users right now, but if I ever want to in the future, the data will be there. 

### Preventing Timing Attacks:
When you're building a login route for a platform like Axion, the normal signup flow looks simple: find the user by their username, and if they exist, compare the password they typed with their saved hash (if you understand why we hash passwords in the first place 💀).

The problem is that password hashing takes CPU work. Because of that, an attacker can measure how long each login request takes to finish, and two different things happen:

- Wrong Uname: There is no hash to compare, so the server uses less CPU time. This gives a faster response, which tells the attacker the username doesn't exist.
- Right Uname: There is a password hash to compare, so the server uses more CPU time. This gives a slower response, which tells the attacker the username exists.

Just by checking the time difference between login requests, an attacker can figure out which accounts are real. 🙃

And the fix was pretty simple. Instead of returning an error right away when a username isn't found, I force the server to calculate and compare a dummy hash.

### Using Mongo:
Oops, this should be added to the bad points, but anywayyyyyyyy, here's why I'm migrating to Postgres (a SQL db):

Tbh, MongoDB actually worked fine to get started, but I somewhat realized I was fighting against how the db was actually designed to work (after reading articles on DEV.to about databases). Here is why I'm making the switch now:

- Mongo wasn't built for relational data, and microforums are relational by nature. Mongo operates on the mindset of *"if X is related to Y, keep them together."* Postgres, on the other hand, was built specifically for relational data. 
- rn when a post gets deleted in Axion, I've to handle the cleanup manually:

  - Start a transaction
  - Run a `deleteOne` operation to remove the post
  - Run a `deleteMany` operation to remove the comments
  - Run another `deleteMany` operation to remove the likes

  It's not that the code is messy, it's just completely manual. Every time I add a new post-related feature, I've to remember to update the deletion logic to clean those up too. With Postgres, cascade deletions automate the process.

- I've no real users, no production data, and Axion isn't even hosted online yet. Everything in my db is just test data I don't care about. That means I can finish this migration in a day or two without risking data corruption.

- Even though these issues aren't hurting Axion at its current small scale, making the jump now sets the app up to scale comfortably into mid-size without technical debt. To keep some of the dev experience I liked with Mongo, I'm going to pair Postgres with Prisma.

## Why there is only a few commits here?
I built the prototype version locally in a few months without version control. Stupid, I know, but it's just a personal project at the end. 😁 (Btw, I did briefly use Git, but stupidly, I choose to wipe the commits because they were "bad")

## So...is this vibecoded?
The wrong question to ask. 😏 Axion isn't vibecoded. Maybe I sometimes use ChatGPT to *refine my writing and English*, I never use it to code. 

At the end of the day, I'm pretty happy that YOU liked my app, and I hope you star and contribute to the repo, because these actions make me really, really happy.

Either way, see you laterrrrr!!

*(PS: I learned all this not from AIs, but from my mom. She's a CS professor)*