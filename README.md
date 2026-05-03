# Clear Path

**Losing someone is hard. The paperwork doesn't have to be.**

Clear Path helps families handle estate notifications after a loss — drafting letters, tracking deadlines, and organizing tasks so you can focus on what matters.

## Features

### Handle an Estate
- Enter information about the deceased and their accounts
- AI generates personalized notification letters for each institution (banks, insurance, Social Security, utilities, etc.)
- Track deadlines with urgency indicators
- Assign tasks to family members and send consolidated email notifications
- Family members receive a portal link to view, edit, and copy their assigned letters

### Prepare Your Information (Plan Ahead)
- Securely store your account details, contacts, and important notes
- Invite trusted family members to access your information when needed
- All data encrypted with Row Level Security via Supabase
- When the time comes, your family has everything in one place

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security)
- **AI**: Vercel AI SDK with Claude
- **Email**: Resend

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase account
- Resend account (for emails)

### Environment Variables

Create a `.env.local` file with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# Production URL (for email links)
NEXT_PUBLIC_URL=https://your-domain.com
```

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Database Setup

The app uses Supabase with the following tables:
- `prepared_estates` - User estate information
- `estate_accounts` - Financial accounts, insurance policies
- `estate_contacts` - Attorneys, accountants, executors
- `estate_notes` - Important notes and instructions
- `trusted_contacts` - Family members with access

All tables have Row Level Security (RLS) enabled to ensure data privacy.

## Project Structure

```
app/
  page.tsx              # Home page (handle estate flow)
  prepare/              # Prepare your info flow
    page.tsx            # Estate preparation form
    actions.ts          # Server actions
  letter/[id]/          # Family member portal
    page.tsx            # View/edit assigned letters
  auth/                 # Authentication
    callback/           # OAuth callback
    sign-up/            # Sign up page
    sign-up-success/    # Email confirmation
  api/
    generate/           # AI letter generation
    send-email/         # Email notifications via Resend

components/
  input-form.tsx        # Estate info input
  institution-cards.tsx # Generated letters & family assignment
  
lib/
  supabase/             # Supabase client setup
```

## How It Works

### Estate Handling Flow
1. User enters deceased's name, state, and situation description
2. AI generates 8 institution notification letters with deadlines
3. User adds family members (name + email)
4. Assigns institutions to family members via dropdown
5. Clicks "Send Assignments" — each person gets ONE email with all their tasks
6. Family members click portal link to view/edit/copy letters

### Prepare Ahead Flow
1. User creates account on `/prepare`
2. Fills in accounts, insurance, contacts, and notes
3. Invites trusted family members by email
4. Data stored securely with RLS
5. Trusted contacts can access when needed

## Security

- All data encrypted at rest via Supabase
- Row Level Security ensures users only access their own data
- Trusted contacts must create accounts and be explicitly invited
- No sensitive data stored client-side
- Password-protected accounts required for the prepare flow

## License

MIT
