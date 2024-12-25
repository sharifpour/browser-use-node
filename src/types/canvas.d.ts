declare module 'canvas' {
    export function createCanvas(width: number, height: number): Canvas;
    export function loadImage(src: Buffer | string): Promise<Image>;

    export interface Canvas {
        getContext(contextId: '2d'): CanvasRenderingContext2D;
    }

    export interface Image {
        width: number;
        height: number;
    }
}