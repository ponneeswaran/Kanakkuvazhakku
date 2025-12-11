import { Expense, Income, Budget } from '../types';

export const getDemoData = (): { expenses: Expense[], incomes: Income[], budgets: Budget[] } => {
    const today = new Date();
    
    const getDate = (offsetDays: number) => {
        const d = new Date(today);
        d.setDate(today.getDate() + offsetDays);
        return d.toISOString().split('T')[0];
    };

    const expenses: Expense[] = [
        {
            id: 'demo-exp-1',
            amount: 150,
            category: 'Food',
            description: 'Morning Coffee',
            date: getDate(0), // Today
            paymentMethod: 'UPI',
            createdAt: Date.now()
        },
        {
            id: 'demo-exp-2',
            amount: 450,
            category: 'Transport',
            description: 'Uber to Office',
            date: getDate(-1), // Yesterday
            paymentMethod: 'Card',
            createdAt: Date.now() - 86400000
        },
        {
            id: 'demo-exp-3',
            amount: 15000,
            category: 'Housing',
            description: 'House Rent',
            date: getDate(-10),
            paymentMethod: 'UPI',
            createdAt: Date.now() - 864000000
        },
        {
            id: 'demo-exp-4',
            amount: 1200,
            category: 'Shopping',
            description: 'Groceries',
            date: getDate(-3),
            paymentMethod: 'Cash',
            createdAt: Date.now() - 259200000
        }
    ];

    const incomes: Income[] = [
        // Scenario 1: Salary Workflow (Past Received + Future Expected)
        {
            id: 'demo-inc-salary-past',
            amount: 100000,
            category: 'Salary',
            source: 'Tech Corp',
            date: getDate(-3), // Received 3 days ago (e.g. 8th)
            recurrence: 'Monthly',
            status: 'Received',
            createdAt: Date.now() - 259200000
        },
        {
            id: 'demo-inc-salary-future',
            amount: 100000,
            category: 'Salary',
            source: 'Tech Corp',
            date: getDate(27), // Next month (approx)
            recurrence: 'Monthly',
            status: 'Expected',
            createdAt: Date.now() - 259200000 + 1 // created just after
        },
        // Scenario 2: Rent (One Received, One Overdue)
        {
            id: 'demo-inc-rent-received',
            amount: 15000,
            category: 'Rent',
            source: 'Tenant John',
            date: getDate(-5), // Due 5 days ago
            recurrence: 'Monthly',
            status: 'Received',
            tenantContact: '+919876543210',
            createdAt: Date.now() - 432000000
        },
        {
            id: 'demo-inc-rent-overdue',
            amount: 12000,
            category: 'Rent',
            source: 'Tenant Mike',
            date: getDate(-5), // Due 5 days ago
            recurrence: 'Monthly',
            status: 'Overdue', // This should show up in Red
            tenantContact: '+919999988888',
            createdAt: Date.now() - 432000000
        }
    ];

    const budgets: Budget[] = [
        { category: 'Food', limit: 5000 },
        { category: 'Transport', limit: 3000 },
        { category: 'Housing', limit: 20000 }
    ];

    return { expenses, incomes, budgets };
};
