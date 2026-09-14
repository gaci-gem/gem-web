import {
    AVATAR_STRATEGIES,
    getAvatarImage,
    getAvatarStrategy,
    resolveAvatar,
} from './avatares-disponibles';

describe('avatar resolver', () => {
    const user = {
        id: '42',
        nombre: 'Ada',
        apellido: 'Lovelace',
        email: 'ada@example.com',
        usuario: 'ada',
        color: '#336699',
    };

    it('uses a distinct deterministic seed for each strategy', () => {
        const avatars = Object.values(AVATAR_STRATEGIES).map(strategy =>
            resolveAvatar({ strategy, user }),
        );

        expect(new Set(avatars.map(avatar => avatar.seed)).size).toBe(4);
        expect(avatars.map(avatar => avatar.image)).toEqual(
            avatars.map(avatar => getAvatarImage(avatar.strategy, user)),
        );
    });

    it('keeps the same image for the same user and strategy', () => {
        expect(getAvatarImage(AVATAR_STRATEGIES.EMAIL, user))
            .toBe(getAvatarImage(AVATAR_STRATEGIES.EMAIL, user));
    });

    it('falls back legacy persisted filenames to the ID strategy', () => {
        expect(getAvatarStrategy('User-1.png')).toBe(AVATAR_STRATEGIES.ID);
        expect(resolveAvatar({ strategy: 'User-1.png', user }).seed)
            .toContain(`:${AVATAR_STRATEGIES.ID}:42`);
    });

    it('uses a safe fallback hue for invalid colors', () => {
        const invalidColor = getAvatarImage(AVATAR_STRATEGIES.ID, { ...user, color: 'not-a-color' });
        const defaultColor = getAvatarImage(AVATAR_STRATEGIES.ID, { ...user, color: '#3366ff' });
        expect(invalidColor).not.toBe(defaultColor);
        expect(invalidColor).toBe(
            getAvatarImage(AVATAR_STRATEGIES.ID, { ...user, color: '#369' }),
        );
    });
});
