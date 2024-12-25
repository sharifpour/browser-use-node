declare module 'sharp' {
    interface Sharp {
        metadata(): Promise<{ width?: number; height?: number }>;
        raw(): Sharp;
        ensureAlpha(): Sharp;
        toBuffer(options?: { resolveWithObject: boolean }): Promise<{ data: Buffer }>;
    }

    type SharpConstructor = (input: Buffer) => Sharp;

    const sharp: SharpConstructor;
    export default sharp;
}