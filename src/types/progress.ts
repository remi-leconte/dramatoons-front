import type { User } from './user'
import type { Webtoon } from './webtoon'

export type ProgressState = '' | 'reading' | 'pause' | 'break' | 'completed'

export interface Progress {
    '@id'?: string;
    id?: number;
    rate?: number | null;
    state?: ProgressState | null;
    bookmark?: number | null;
    reader?: User;
    webtoon?: Webtoon;
}

export const createDefaultProgress = (): Progress => ({
    id: undefined,
    bookmark: null,
    rate: null,
    state: null,
    reader: undefined,
    webtoon: undefined
})

export interface ProgressPayload {
    webtoon?: string;
    state?: ProgressState | null;
    rate?: number | null;
    bookmark?: number | null;
}