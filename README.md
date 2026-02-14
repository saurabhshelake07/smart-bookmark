# Smart Bookmark App

A production-ready bookmark manager built with **Next.js (App Router)** and **Supabase**, deployed on **Vercel**.

---

## 🚀 Live Application

🔗 https://your-vercel-domain.vercel.app  

---

## 📌 Features

- Google OAuth authentication (Google login only)
- Add bookmark (Title + URL)
- Delete bookmark
- Bookmarks are private per user
- Real-time updates across multiple browser tabs
- Secure Row Level Security (RLS)
- Fully deployed on Vercel

---

## 🛠 Tech Stack

- Next.js (App Router)
- Supabase (Authentication, Database, Realtime)
- Tailwind CSS
- Vercel (Deployment)

---

## 🔐 Security Implementation

- Row Level Security (RLS) enabled in Supabase
- Users can only access their own bookmarks
- Secure environment variable management
- No sensitive credentials exposed in client code

---

## ⚙️ Architecture Overview

- Client-side authentication using Supabase
- Per-user data filtering using `user_id`
- Real-time database subscriptions using Supabase Realtime
- Serverless deployment via Vercel
- Environment separation (Development vs Production)

---

## 🚧 Challenges & Solutions

- Resolved OAuth redirect misconfiguration in production
- Managed environment variables across deployment environments
- Handled authentication state in Next.js App Router
- Implemented secure per-user data isolation
- Debugged production-only deployment issues
- Implemented real-time synchronization without refresh

---

## 💻 Local Development

Clone the repository:

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install
