export class Countdown {

    private countdownUpdater: NodeJS.Timeout | null = null

    constructor(
        private count: number,
        private onUpdate: (mmss: string) => void) {
            this.setTimer();
    }

    public increment = (incrementBy: number) => {
        this.count += incrementBy;
        if (this.countdownUpdater == null) {
            this.setTimer();
        }
    }

    public getDisplayValue = () => {
        // TODO: Handle times that also include an hour
        const [minutes, seconds] =
        [Math.floor(this.count / 60), this.count % 60].map(
            (n: number) => n.toString().padStart(2, '0'));
        return `${minutes}:${seconds}`;
    }

    private setTimer = () => {
        this.countdownUpdater = setInterval(() => {
            if (this.count > 0) {
                this.count--;
                this.updateValue();
            } else if (this.countdownUpdater != null) {
                clearInterval(this.countdownUpdater);
                this.countdownUpdater = null;
            }
        }, 1000);

        this.updateValue();
    }

    private updateValue = () => {
        const displayValue = this.getDisplayValue();
        this.onUpdate(displayValue);
    }
}
