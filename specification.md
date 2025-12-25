# Application Specification: Kanakkuvazhakku

## 1. Overview
**Kanakkuvazhakku** (Tamil for "Accounting/Ledger") is a smart, AI-powered, offline-first personal finance manager. It is designed to bridge the gap between simple ledger books and complex banking apps, focusing on ease of entry, rent collection tracking, and proactive financial coaching using Google Gemini AI.

### Core Philosophy
- **Privacy First**: Data stays on the device (Local-first).
- **AI-Enhanced**: Natural language parsing for transactions and conversational insights.
- **Micro-SaaS features**: Built-in rent management with WhatsApp follow-ups.
- **Resilient**: Fully functional offline with encrypted backup/restore.

---

## 2. Design System & Theme

### Color Palette (Teal & Amber)
- **Primary**: `#0F766E` (Teal 700) - Primary actions, headers.
- **Secondary**: `#0D9488` (Teal 600) - Selection states, secondary buttons.
- **Accent**: `#F59E0B` (Amber 500) - Highlighting, warnings, tips.
- **Background**: `#F8FAFC` (Slate 50) - App background.
- **Surface**: `#FFFFFF` (White) - Cards, Modals.
- **Dark Mode Surface**: `#1E293B` (Slate 800).
- **Negative/Expense**: `#EF4444` (Red 500).
- **Positive/Income**: `#10B981` (Emerald 500).

### Typography
- **Sans-Serif**: `Inter` (or system default).
- **Scale**:
  - **Heading 1**: 24px, Bold.
  - **Heading 2**: 18px, Bold.
  - **Body**: 14px, Regular.
  - **Caption**: 12px, Medium.

### Iconography
- **Set**: Lucide-React.
- **Style**: Thin strokes (2px), rounded corners.

---
-
## 3. Core Features

### A. Authentication & Onboarding
- **Identity**: Login via Email or Mobile Number.
- **Security**: Local password encryption + Biometric Login (FaceID/Fingerprint).
- **Flow**:
  1. Animated Splash Screen.
  2. Multi-step Onboarding (Language: EN/TA, Currency, Profile Setup).
  3. Option to "Import .kbf" to restore existing accounts.

### B. Intelligent Dashboard
- **Financial Status**: Real-time "Net Balance" and "Period Expense" cards.
- **AI Spending Insight**: A dynamic banner powered by Gemini that analyzes recent transactions to provide one-sentence coaching.
- **Charts**:
  - **Area Chart**: Spending trends over time (Daily/Weekly/Monthly).
  - **Donut Chart**: Category-wise breakdown with interactive legends.
- **Navigation**: Swipe-to-navigate date ranges.

### C. Transaction Management
- **Expense Tracking**:
  - Fields: Amount, Description, Category, Date, Payment Method (Cash/Card/UPI).
  - **Magic Fill**: A text input where users type "Spent 50 on Biryani today" and AI auto-populates the form.
- **History View**:
  - Grouped by date.
  - **Swipe-to-Delete**: Destructive swipe gesture with "Undo" snackbar.
  - Advanced filters: Date range, Min/Max amount, Multi-category selection.
  - Detailed modal for every transaction.

### D. Income & Rent Tracking
- **Income Sources**: Salary, Interest, Business, Gift, etc.
- **Rent Management**:
  - Specific "Tenant Name" and "Contact Number" fields.
  - Automatic status: `Expected`, `Received`, `Overdue`.
  - **Follow-up Tool**: Direct buttons to trigger WhatsApp reminders or phone calls for overdue rent.
- **Recurrence Engine**: Support for Monthly/Yearly recurring income with "Self-healing" logic (automatically generates the next entry when one is marked as received).

### E. Budgeting
- **Monthly Limits**: Set category-specific spending caps.
- **Visual Progress**: Gradient progress bars (Teal -> Amber -> Red).
- **Alerts**: Highlight categories that have exceeded or are near the limit.

### F. AI Assistant (Gemini)
- **Chat Interface**: A dedicated tab to talk to "Kanakkuvazhakku".
- **Capabilities**:
  - "How much did I spend on Food last week?"
  - "Add an expense of 200 for Petrol."
  - "Should I save more this month?"
- **Tool Use**: The AI can trigger app functions (Add/Delete/Query) directly from the chat.

### G. Data & Privacy
- **Encryption**: AES-like XOR encryption for local files.
- **Backup**: Generates a `.kbf` (Kanakku Backup File) which can be shared/emailed.
- **Export**: Exports transactional data as CSV for spreadsheet analysis.
- **Offline Mode**: 100% functionality without internet; internet only required for AI features.

---

## 4. Technical Architecture (React Native)

### State Management
- **Context API**: For global user profile and transaction lists.
- **Local Storage**: `AsyncStorage` or `SQLite` for persistent data.

### Platform Adaptations
- **Tablet**: Master-Detail view (Navigation on left, content in center, insights on right).
- **Desktop**: Resizable windows with keyboard shortcuts (Ctrl+N for new expense).
- **Haptics**: Subtle vibrations for long-press and success actions.

### Data Model (`types.ts`)
```typescript
interface Expense {
  id: string;
  amount: number;
  category: Category;
  description: string;
  date: string; // ISO
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Other';
}

interface Income {
  id: string;
  amount: number;
  category: IncomeCategory;
  source: string; 
  date: string;
  recurrence: 'None' | 'Monthly' | 'Yearly';
  status: 'Expected' | 'Received' | 'Overdue';
  tenantContact?: string;
}

interface Budget {
  category: Category;
  limit: number;
}
```

---

## 5. User Interface Screens

1.  **SplashView**: Branding and logo animation.
2.  **AuthView**: Login/Signup toggle with Forgot Password flow.
3.  **OnboardingView**: Profile initialization.
4.  **HomeView**: Summary cards + Quick Insight + Trend Chart.
5.  **HistoryView**: Searchable, filterable list of all transactions.
6.  **IncomeView**: Specialized view for pending and recurring earnings.
7.  **ChatView**: Full-screen conversation with the AI.
8.  **BudgetView**: Management of monthly spending caps.
9.  **AccountView**: Profile editing, backup/export tools, security settings.
10. **TransactionDetail**: Detailed breakdown of a single record with delete options.

---

## 6. Implementation Notes for AI Integration
- **Model**: `gemini-2.5-flash-latest` (balanced speed/intelligence).
- **System Prompt**: "You are a friendly personal accountant named Kanakkuvazhakku. You help users manage money. Be concise, use emojis occasionally, and speak in the user's preferred language (English or Tamil)."
- **Tools**: Provide function declarations for `add_expense`, `add_income`, and `delete_transaction`.