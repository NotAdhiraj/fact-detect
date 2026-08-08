# Fact Rot Detector

## What this is

Documents go stale silently. A README, a pricing page, an onboarding guide, a product overview... they all get written once and then slowly drift away from the truth as the product changes underneath them. Nobody rereads old docs to check if the claims inside are still accurate, so wrong information just sits there until a user or a new hire trips over it.

Fact Rot Detector solves this by reading any document, pulling out every checkable factual claim inside it, and verifying each one against live web data in real time. Instead of guessing whether a doc is still trustworthy, you get an actual answer for every claim it makes.

## Who it's for

Individuals who want to sanity check a document before sharing or trusting it. Paste something in, get an instant answer, no account needed.

Companies and teams who maintain documentation that other people rely on. You can generate a shareable link for any doc you upload, send it to your team or the public, and anyone with the link can see the verification results and flag anything that looks wrong. This turns fact checking into something collaborative instead of something one person has to remember to do manually every few months.

## How it works

You give the app a document, either by pasting text directly or uploading a PDF.

The app sends the document to an AI model that extracts every distinct, independently checkable factual claim inside it. Things like version numbers, dates, pricing, feature claims, or statements like "X supports Y." Vague opinions or non factual sentences are skipped.

Each extracted claim is then checked individually. The app runs a live web search for that specific claim and hands the search results to the AI model along with the claim itself. The model is instructed to only confirm a claim if the search results are clearly about the exact same entity named in the claim, not just something that sounds similar. Based on that, each claim gets marked as one of three things.

Confirmed means current web sources support the claim.

Stale or unverifiable means the sources either contradict the claim or there simply isn't enough information to confirm it either way.

Every claim shows its reasoning underneath so you can see why it landed on that verdict, not just the label itself.

Once a document has been checked, anyone viewing it can flag a specific claim if they believe the verdict is wrong, which adds a visible flag count to that claim for others to see.

## Why it's useful

Most tools either help you write documents or help you search the web, but nothing sits in between and continuously asks "is this specific sentence still true right now." That gap is where fact rot lives. This tool makes that invisible decay visible and actionable, and it does it without requiring anyone to manually audit a document line by line.

## Tech stack

Next.js using the App Router, written in TypeScript, for both the frontend pages and the backend API routes.

Tailwind CSS for styling, with Framer Motion handling the blur and fade transitions between pages.

Supabase as the database, storing documents, extracted claims, and flags, with row level security enabled.

Groq for the AI model calls that extract claims from a document and reason about whether each claim is confirmed, stale, or unverifiable, using Llama 3.3 70B.

Tavily as the live web search API, giving the model current search results to check each claim against instead of relying on its own training knowledge.

pdf parse for extracting text from uploaded PDF files so they can go through the same checking pipeline as pasted text.

Vercel for deployment.

## Running it locally

You will need Node.js installed, along with accounts and free API keys for Supabase, Groq, and Tavily.

Clone the repository and install dependencies.

```
npm install
```

Create a file called `.env.local` in the project root and add the following, replacing each value with your own key.

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
TAVILY_API_KEY=your_tavily_api_key
```

Set up the Supabase tables using the SQL migration included in the project, which creates tables for documents, claims, and flags.

Run the development server.

```
npm run dev
```

Open `http://localhost:3000` in your browser. From there you can paste a document on the Check a Doc page, or go through the Companies flow to generate a shareable link for a document.

## Notes

This was built as a hackathon prototype in a single day, so a few things are intentionally kept simple. There is no user authentication, no billing, and no rate limiting yet. In a production version, the next additions would be per user request limits to protect against abuse, caching verification results per claim so repeated checks on an unchanged document are free, and background rechecking so high traffic documents stay fresh without a user having to manually trigger a recheck.