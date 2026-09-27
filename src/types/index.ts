export * from './user'
export * from './webtoon'
export * from './progress'

export interface HydraView {
    '@id'?: string;
    '@type'?: string;
    'hydra:first'?: string;
    'hydra:last'?: string;
    'hydra:next'?: string;
    'hydra:previous'?: string;
}

export interface HydraCollection<T> {
    '@context'?: string;
    '@id'?: string;
    '@type'?: string;
    'hydra:member'?: T[];
    'hydra:totalItems'?: number;
    'hydra:view'?: HydraView;
    'hydra:search'?: Record<string, unknown>;
    // Fallbacks
    member?: T[];
    totalItems?: number;
}