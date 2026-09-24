export interface User {
    id: number;
    login: string;
    roles?: string[];
    verified: boolean;
    publish: boolean;
    email: string;
    lastLogin: string | null;
}