import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import { createDefaultProgress, isEmptyProgress } from '@/types/progress'
import type { Webtoon, Progress, ProgressState } from '@/types'

const LEAVE_UNPUBLISHED_MESSAGE = "Ce Webtoon n'est plus disponible, si vous arrêtez de le suivre alors il disparaitra de votre bibliothèque. Continuer ?"

// Un webtoon dépublié n'est plus visible de celui qui arrête de le suivre, sauf de son créateur
export function confirmLeavingUnpublished(webtoon: Webtoon, progress: Progress): boolean {
    const authStore = useAuthStore()
    const losesAccess = !webtoon.publish
        && webtoon.creator?.id !== authStore.userId
        && !!progress.id
        && isEmptyProgress(progress)

    return !losesAccess || confirm(LEAVE_UNPUBLISHED_MESSAGE)
}

// L'API refuse un suivi vide : il est supprimé au lieu d'être enregistré
export async function saveProgress(webtoonId: number | undefined, progress: Progress): Promise<void> {
    if (isEmptyProgress(progress)) {
        if (progress.id) {
            await api.delete(`/webtoon_users/${progress.id}`, { responseType: 'text' })
            progress.id = undefined
        }
        return
    }

    // Un champ numérique vidé dans le formulaire vaut '' (v-model.number), que l'API refuse
    const payload = {
        state: progress.state || null,
        rate: typeof progress.rate === 'number' ? progress.rate : null,
        bookmark: progress.bookmark || null
    }

    if (progress.id) {
        await api.patch(`/webtoon_users/${progress.id}`, payload, {
            headers: { 'Content-Type': 'application/merge-patch+json' }
        })
    } else {
        if (!webtoonId) throw new Error('Webtoon sans id : impossible de créer son suivi.')
        const response = await api.post<Progress>('/webtoon_users', {
            webtoon: `/webtoons/${webtoonId}`,
            ...payload
        }, { headers: { 'Content-Type': 'application/ld+json' } })
        progress.id = response.data.id
    }
}

export function useWebtoonProgress() {
    // Renvoie vrai si le webtoon doit disparaître de la bibliothèque (dépublié, plus suivi)
    const changeProgress = async (webtoon: Webtoon, change: Partial<Progress>): Promise<boolean> => {
        const progress = webtoon.userProgress ||= createDefaultProgress()
        const previous = { ...progress }
        Object.assign(progress, change)

        if (!confirmLeavingUnpublished(webtoon, progress)) {
            Object.assign(progress, previous)
            return false
        }

        try {
            await saveProgress(webtoon.id, progress)
            return !webtoon.publish && !progress.id && webtoon.creator?.id !== useAuthStore().userId
        } catch (error) {
            console.error(error)
            Object.assign(progress, previous)
            return false
        }
    }

    const changeStatus = (webtoon: Webtoon, newState: ProgressState) => changeProgress(webtoon, { state: newState })
    const changeBookmark = (webtoon: Webtoon, newBookmark: number) => changeProgress(webtoon, { bookmark: newBookmark })

    return { changeStatus, changeBookmark }
}
