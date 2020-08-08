import { MediaInstance, SetMediaStateOptions, log } from '@microsoft/mixed-reality-extension-sdk';
import { clamp } from 'lodash';

// A class acting as a delegate to the SDK's MediaInstance class,
// and tracks the options specified to it, simplifying some of the logic.
export class PlayingMedia {
    private lastSetOptions: SetMediaStateOptions;

    constructor(
        private mediaInstance?: MediaInstance,
        initialOptions?: SetMediaStateOptions
    ) {
        this.lastSetOptions = initialOptions || {};
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

    // Utility functions to manage specific options

    // Change the paused volume by a given percentage, taking care
    // to remain inside the allowed volume range
    changeVolume = (byPercent: number): void => {
        const currentVolume = this.currentVolume;
        if (currentVolume != undefined) {
            const amplificationFactor = (100 + byPercent) / 100.0;
            const newVolume = clamp(currentVolume * amplificationFactor, 0, 1);
            log.debug("Set volume to:", newVolume);
            this.setState({volume: newVolume});
        }
        return;
    }

    // Current volume on a scale of 0 to 1, or undefined if not set.
    get currentVolume(): number | undefined {
        return this.lastSetOptions.volume;
    }

    private updateOptions = (newOptions: Partial<SetMediaStateOptions>) => {
        Object.assign(this.lastSetOptions, newOptions);
    }
}
