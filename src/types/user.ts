import type { ProgressState } from './progress'

export type UserSortKey = 'id' | 'login' | 'email' | 'roles' | 'lastLogin'
export type SortByOption = 'added' | 'rating' | 'user_rating' | 'title'
export type SortOrderOption = 'asc' | 'desc'

export interface User {
    '@id'?: string;
    id?: number;
    login: string;
    email: string;
    roles: string[];
    verified?: boolean;
    publish?: boolean;
    created?: string;
    updated?: string | null;
    lastLogin?: string | null;
    searchSortBy?: SortByOption | null;
    searchSortOrder?: SortOrderOption | null;
    searchStatus?: ProgressState | '' | null;
    searchItemsPerPage?: number | null;
}

export const createDefaultUser = (): User => ({
    id: undefined,
    login: '',
    email: '',
    roles: [],
    verified: undefined,
    publish: undefined,
    created: undefined,
    updated: undefined,
    lastLogin: undefined,
    searchSortBy: undefined,
    searchSortOrder: undefined,
    searchStatus: undefined,
    searchItemsPerPage: undefined
})

export interface UserUpdatePayload {
    login?: string;
    email?: string;
    password?: string;
}

export interface LoginPayload {
    login: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    refresh_token: string;
    user: User;
}

export interface RegisterPayload {
    email: string;
    password: string;
    login: string;
}

export interface ForgotPasswordPayload {
    email: string;
}

export interface ResetPasswordPayload {
    token: string;
    password: string;
}

export interface VerifyPayload {
    token: string;
}