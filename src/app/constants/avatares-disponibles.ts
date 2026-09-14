import { blobatarUri } from 'blobatar/uri';

/** Persisted values are versioned so future algorithm changes do not reinterpret old choices. */
export const AVATAR_STRATEGIES = {
    ID: 'id-v1',
    FULL_NAME: 'full-name-v1',
    EMAIL: 'email-v1',
    USERNAME: 'username-v1',
} as const;

export type AvatarStrategy = typeof AVATAR_STRATEGIES[keyof typeof AVATAR_STRATEGIES];

export interface AvatarUser {
    id?: string;
    nombre?: string;
    apellido?: string;
    email?: string;
    usuario?: string;
    color?: string;
}

export interface AvatarOption {
    strategy: AvatarStrategy;
    label: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
    { strategy: AVATAR_STRATEGIES.ID, label: 'ID' },
    { strategy: AVATAR_STRATEGIES.FULL_NAME, label: 'Full name' },
    { strategy: AVATAR_STRATEGIES.EMAIL, label: 'Email' },
    { strategy: AVATAR_STRATEGIES.USERNAME, label: 'Username' },
];

export const AVATAR_POR_DEFECTO = AVATAR_STRATEGIES.ID;

const DEFAULT_HUE = 210;

function normalizeSeedValue(value: string | undefined): string {
    return (value ?? '').normalize('NFC').trim().replace(/\s+/g, ' ');
}

function getStrategy(strategy: string | null | undefined): AvatarStrategy {
    return AVATAR_OPTIONS.some(option => option.strategy === strategy)
        ? strategy as AvatarStrategy
        : AVATAR_STRATEGIES.ID;
}

function getSeed(strategy: AvatarStrategy, user: AvatarUser): string {
    const id = normalizeSeedValue(user.id) || 'unknown-user';
    const fullName = normalizeSeedValue(`${user.nombre ?? ''} ${user.apellido ?? ''}`) || id;
    const email = normalizeSeedValue(user.email).toLowerCase() || id;
    const username = normalizeSeedValue(user.usuario).toLowerCase() || id;
    const value = {
        [AVATAR_STRATEGIES.ID]: id,
        [AVATAR_STRATEGIES.FULL_NAME]: fullName,
        [AVATAR_STRATEGIES.EMAIL]: email,
        [AVATAR_STRATEGIES.USERNAME]: username,
    }[strategy];

    return `gaci-avatar-v1:${strategy}:${value}`;
}

function hexToHue(color: string | undefined): number {
    const value = color?.trim().replace(/^#/, '');
    if (!value || !/^(?:[\da-fA-F]{3}|[\da-fA-F]{6})$/.test(value)) return DEFAULT_HUE;

    const hex = value.length === 3
        ? value.split('').map(part => part + part).join('')
        : value;
    const red = parseInt(hex.slice(0, 2), 16) / 255;
    const green = parseInt(hex.slice(2, 4), 16) / 255;
    const blue = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;
    if (delta === 0) return DEFAULT_HUE;

    let hue = 0;
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    return Math.round((hue * 60 + 360) % 360);
}

/** Resolves legacy PNG values to the ID strategy and returns a safe local data URI. */
export function resolveAvatar(input: { strategy?: string | null; user: AvatarUser }): {
    strategy: AvatarStrategy;
    seed: string;
    image: string;
} {
    const strategy = getStrategy(input.strategy);
    const seed = getSeed(strategy, input.user);
    return {
        strategy,
        seed,
        image: blobatarUri(seed, {
            background: 'circle',
            hue: hexToHue(input.user.color),
            size: 120,
        }),
    };
}

export function getAvatarImage(strategy: string | null | undefined, user: AvatarUser): string {
    return resolveAvatar({ strategy, user }).image;
}

export function getAvatarStrategy(value: string | null | undefined): AvatarStrategy {
    return getStrategy(value);
}
