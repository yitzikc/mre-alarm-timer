import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Countdown } from './countdown'
import { getParameterLastValue } from './parameter_set_util'

/**
 * The main class of this app. All the logic goes here.
 */
export default class AlarmTimer {
	private rootActor?: MRE.Actor = undefined;
	private timerBody?: MRE.Actor = undefined;
	private timerContent?: MRE.Actor = undefined;
	private countdownTimer?: Countdown = undefined;
	private assets: MRE.AssetContainer;

	private alarmSound?: MRE.Sound = undefined;
	private soundPlaying?: MRE.MediaInstance = undefined;

	// Number of seconds to count initially
	private readonly initialCount: number;

	// Increment to the counter (in seconds) when clicked
	private readonly increment: number;


	constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
		this.initialCount = parseInt(getParameterLastValue(params, 'c', '60'));
		this.increment = parseInt(getParameterLastValue(params, 'i', '60'));
		this.assets = new MRE.AssetContainer(this.context);
		this.context.onStarted(() => this.started());
	}

	get setToInitial(): boolean {
		return this.increment == 0;
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private async started() {
		this.rootActor = MRE.Actor.Create(this.context, {
            actor: {
                name: 'Root Actor',
            }
		});

		await this.createBody();
	}

	private async createBody() {
		const square = this.assets.createBoxMesh('square', 1.2, 0.5, 0.20);
		this.timerBody = MRE.Actor.Create(this.context, {
			actor: {
				name: 'timerBody',
				parentId: this.rootActor!.id,
				appearance: { meshId: square.id },
				transform: {
					app: {
						position: { x: 0, y: 0.5, z: 0.2 },
					}
				}
			}
		});
		this.timerBody.setCollider(MRE.ColliderType.Box, true);

		this.timerContent = MRE.Actor.Create(this.context, {
			actor: {
				name: 'timerContent',
				parentId: this.timerBody.id,
				text: {
					contents: '',
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

		this.alarmSound = this.assets.createSound(
			'alarmSound',
			{ uri: `${this.baseUrl}/alarm.ogg` });
		this.countdownTimer = new Countdown(
			this.initialCount,
			(value: string) => {
				if (this.timerContent != undefined) {
					this.timerContent.text.contents = value;
				}
			},
			() => {
				if (this.alarmSound != undefined) {
					// TODO: Keep the media instance
					this.soundPlaying =
						this.rootActor!.startSound(this.alarmSound.id, { volume: 0.5  });
				}
			});
		const buttonBehavior = this.timerBody.setBehavior(MRE.ButtonBehavior);
		buttonBehavior.onClick(() => {
			if (this.setToInitial) {
				this.countdownTimer?.setValue(this.initialCount)
			}
			else {
				this.countdownTimer?.increment(this.increment);
			}

			if (this.soundPlaying != undefined) {
				this.soundPlaying.setState({paused: true});
				this.soundPlaying.stop();
				this.soundPlaying = undefined;
			}
		});
    }
}
