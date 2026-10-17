import api from '../../services/api'
import { createDefaultProgress } from '@/types/progress'
import type { Webtoon, ProgressState } from '@/types'

export function useWebtoonProgress() {
    const changeStatus = async (webtoon: Webtoon, newState: ProgressState) => {
        if (!webtoon.userProgress) webtoon.userProgress = createDefaultProgress()
        const previousState = webtoon.userProgress.state
        webtoon.userProgress.state = newState

        try {
            if (webtoon.userProgress.id) {
                await api.patch(`/webtoon_users/${webtoon.userProgress.id}`, { state: newState }, {
                    headers: { 'Content-Type': 'application/merge-patch+json' }
                })
            } else {
                const response = await api.post('/webtoon_users', {
                    webtoon: `/webtoons/${webtoon.id}`,
                    state: newState
                }, { headers: { 'Content-Type': 'application/ld+json' } })
                webtoon.userProgress.id = response.data.id
            }
        } catch (error) {
            console.error(error)
            webtoon.userProgress.state = previousState
        }
    }

    const changeBookmark = async (webtoon: Webtoon, newBookmark: number) => {
        if (!webtoon.userProgress) webtoon.userProgress = createDefaultProgress()
        const previousBookmark = webtoon.userProgress.bookmark
        webtoon.userProgress.bookmark = newBookmark

        try {
            if (webtoon.userProgress.id) {
                await api.patch(`/webtoon_users/${webtoon.userProgress.id}`, { bookmark: newBookmark }, {
                    headers: { 'Content-Type': 'application/merge-patch+json' }
                })
            } else {
                const response = await api.post('/webtoon_users', {
                    webtoon: `/webtoons/${webtoon.id}`,
                    bookmark: newBookmark
                }, { headers: { 'Content-Type': 'application/ld+json' } })
                webtoon.userProgress.id = response.data.id
            }
        } catch (error) {
            console.error(error)
            webtoon.userProgress.bookmark = previousBookmark
        }
    }

    return { changeStatus, changeBookmark }
}