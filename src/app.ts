import * as MRE from '@microsoft/mixed-reality-extension-sdk';

/**
 * The main class of this app. All the logic goes here.
 */
export default class AlarmTimer {
	//private text: MRE.Actor = null;
	private timerBody: MRE.Actor = null;
	private timerContent: MRE.Actor = null;
	private assets: MRE.AssetContainer;
	private count = 100;
	private countdownUpdater: NodeJS.Timeout;

	constructor(private context: MRE.Context, private baseUrl: string) {
		this.context.onStarted(() => this.started());
	}

	private timerValue(): string {
		const [minutes, seconds] =
			[Math.floor(this.count / 60), this.count % 60].map(
				(n: number) => n.toString().padStart(2, '0'));
		return `${minutes}:${seconds}`;
	}

	private setTimer() {
		this.countdownUpdater = setInterval(() => {
			if (this.count > 0) {
				this.count--;
				this.timerContent.text.contents = this.timerValue();
			} else {
				clearInterval(this.countdownUpdater);
			}
		}, 1000);
	}
	/**
	 * Once the context is "started", initialize the app.
	 */
	private async started() {
        this.setTimer();
        
		this.assets = new MRE.AssetContainer(this.context);
		const square = this.assets.createBoxMesh('square', 1.2, 0.5, 0.20);
		this.timerBody = MRE.Actor.Create(this.context, {
			actor: {
				name: 'timerBody',
				appearance: { meshId: square.id },
				transform: {
					app: {
						position: { x: 0, y: 0.5, z: 0.2 },
					}
				}
			}
		});

		this.timerContent = MRE.Actor.Create(this.context, {
			actor: {
				name: 'timerContent',
				parentId: this.timerBody.id,
				text: {
					contents: this.timerValue(),
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: { r: 30 / 255, g: 30 / 255, b: 30 / 255 },
					height: 0.3
				},
				transform: {
					local: {
						position: { x: 0, y: 0, z: -this.timerBody.transform.app.position.z }
					}
				}
			}
		});

    }
    
}
