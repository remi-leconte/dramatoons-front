import type { User } from './user'
import type { Webtoon } from './webtoon'

export interface Progress {
    id: number;
    rate: number;
    state: string;
    bookmark: number;
    reader: User;
    webtoon: Webtoon;
}