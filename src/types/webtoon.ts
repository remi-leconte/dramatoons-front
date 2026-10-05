import type { User } from './user'
import type { Progress } from './progress'
import { createDefaultProgress } from './progress'

export type WebtoonSortKey = 'id' | 'title' | 'status' | 'publish' | 'updated'
export type WebtoonStatus = 'ongoing' | 'completed'

export interface WebtoonTitle {
    '@id'?: string;
    '@type'?: string;
    id?: number;
    title: string;
    webtoon?: string;
}

export interface Webtoon {
    '@id'?: string;
    id?: number;
    title: WebtoonTitle;
    secondaryTitles?: WebtoonTitle[];
    status: WebtoonStatus;
    publish: boolean;
    chapter?: number;
    image: string;
    updated?: string;
    averageRating?: number;
    readersCount?: number;
    creator?: User;
    userProgress?: Progress;
}

export const createDefaultWebtoon = (): Webtoon => ({
    id: undefined,
    title: {
        title: ''
    },
    secondaryTitles: [],
    status: 'ongoing',
    publish: false,
    chapter: 0,
    image: '',
    updated: undefined,
    averageRating: undefined,
    readersCount: undefined,
    creator: undefined,
    userProgress: createDefaultProgress()
})

export type WebtoonPayload = Pick<Webtoon, 'title' | 'status' | 'publish'>