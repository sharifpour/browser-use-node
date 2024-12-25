import sharp from 'sharp';
import GIFEncoder from 'gifencoder';

interface GifOptions {
    delay?: number;
    quality?: number;
    repeat?: number;
    timeout?: number;
}

export async function createGif(
    frames: Buffer[],
    options: GifOptions = {}
): Promise<Buffer> {
    const firstFrame = frames[0];
    if (!firstFrame) throw new Error('No frames to encode');

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('GIF creation timed out')), 
            options.timeout || 30000); // 30 second default timeout
    });

    const createGifPromise = async () => {
        // Get dimensions of first frame
        const { width, height } = await sharp(firstFrame).metadata();
        if (!width || !height) throw new Error('Invalid image dimensions');

        // Create GIF encoder
        const encoder = new GIFEncoder(width, height);
        encoder.start();
        encoder.setDelay(options.delay || 1000);
        encoder.setQuality(options.quality || 10);
        encoder.setRepeat(options.repeat || 0);

        // Process each frame with progress logging
        for (let i = 0; i < frames.length; i++) {
            console.log(`Processing frame ${i + 1}/${frames.length}...`);
            
            // Convert to raw pixels
            const { data } = await sharp(frames[i])
                .raw()
                .ensureAlpha()
                .toBuffer({ resolveWithObject: true });

            encoder.addFrame(data);
        }

        encoder.finish();
        return encoder.out.getData();
    };

    // Race between GIF creation and timeout
    return Promise.race([createGifPromise(), timeoutPromise]) as Promise<Buffer>;
}