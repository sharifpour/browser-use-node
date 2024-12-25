declare module 'gifencoder' {
    class GIFEncoder {
        constructor(width: number, height: number);
        start(): void;
        setDelay(ms: number): void;
        setQuality(quality: number): void;
        setRepeat(repeat: number): void;
        addFrame(pixels: Buffer): void;
        finish(): void;
        out: {
            getData(): Buffer;
        };
    }
    export = GIFEncoder;
}