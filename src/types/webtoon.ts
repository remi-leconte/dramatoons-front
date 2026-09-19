import type { User } from './user'

export interface UserProgress {
    id: number | null
    bookmark: number | null
    rate: number | null
    state: string | null
}

export interface Webtoon {
    id: number | null
    title: string
    status: string
    publish: boolean
    chapter: number
    image: string
    updated?: Date | string | null
    averageRating: number | null
    readersCount: number | null
    creator?: User | null
    userProgress?: UserProgress
}