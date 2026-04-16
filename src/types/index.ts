export type BoxColor = {
    id: string;
    name: string;
    hex: string;
    shortCode: string;
};

export type User = {
    id: string;
    name: string;
    shortCode: string;
};

export type BoxTransaction = {
    id: string;
    userCode: string;
    userName: string;
    colorCode: string;
    colorName: string;
    quantity: number;
    type?: 'OUTGOING' | 'RETURN';
    timestamp: number;
};

export type DashboardStats = {
    totalOutgoing: number;
    totalReturns: number;
    balance: number;
    byColor: Record<string, number>;
};
