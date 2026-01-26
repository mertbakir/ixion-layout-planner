const adjectives: string[] = [
    'agile', 'blissful', 'brave', 'bright', 'calm', 'clever', 'daring', 'deep', 'eager', 'fast', 'fierce',
    'flying', 'gentle', 'golden', 'happy', 'humble', 'jolly', 'keen', 'lively', 'mighty', 'nimble', 'noble',
    'peaceful', 'quick', 'radiant', 'rapid', 'resilient', 'robust', 'silent', 'swift', 'tranquil', 'vivid',
    'wise', 'zen'
];

const nouns: string[] = [
    'anchor', 'beacon', 'comet', 'core', 'crater', 'dragon', 'echo', 'falcon', 'galaxy', 'gateway', 'gemini',
    'harbor', 'horizon', 'javelin', 'journey', 'kraken', 'lantern', 'matrix', 'nebula', 'nexus', 'oasis',
    'orbit', 'phoenix', 'pillar', 'pioneer', 'portal', 'quasar', 'rocket', 'sentinel', 'shadow', 'spirit',
    'star', 'summit', 'titan', 'vortex', 'voyager', 'whisper', 'zephyr'
];

export class NameGenerator {
    public static generate(): string {
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${adjective}-${noun}`;
    }
}
