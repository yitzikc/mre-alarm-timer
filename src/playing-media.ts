import { MediaInstance, SetMediaStateOptions } from '@microsoft/mixed-reality-extension-sdk';

// A class acting as a delegate to the SDK's MediaInstance class,
// and tracks the options specified to it, simplifying some of the logic.
export class PlayingMedia {
    private lastSetOptions: Partial<SetMediaStateOptions>;

    constructor(private mediaInstance?: MediaInstance) {
        this.lastSetOptions = {};
    }

    // Delegate the methods of MediaInstance to the MediaInstance object

    setState = (options: SetMediaStateOptions): void => {
        this.mediaInstance?.setState(options);
        this.updateOptions(options);
    }

    pause = (): void => {
        this.mediaInstance?.pause();
        this.updateOptions({paused: true});
    }

    resume = (): void => {
        this.mediaInstance?.resume();
        this.updateOptions({paused: false});
    }

    stop = () : void => {
        this.mediaInstance?.pause();
        this.mediaInstance?.stop();
        this.mediaInstance = undefined;
        this.lastSetOptions = {};
    }

    // Properties for inquiring current state
    get isLoaded(): boolean {
        return this.mediaInstance != undefined;
    }

    get isPaused(): boolean {
        return this.lastSetOptions.paused || false;
    }

    // Current volume on a scale of 0 to 1, or undefined if not set.
    get currentVolume(): number | undefined {
        return this.lastSetOptions.volume;
    }

    private updateOptions = (newOptions: Partial<SetMediaStateOptions>) => {
        Object.assign(this.lastSetOptions, newOptions);
    }
}
