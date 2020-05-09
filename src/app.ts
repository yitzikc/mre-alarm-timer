import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Countdown } from './countdown'
import { getParameterLastValue } from './parameter_set_util'

/**
 * The main class of this app. All the logic goes here.
 */
export default class AlarmTimer {
	private timerBody?: MRE.Actor = undefined;
	private timerContent?: MRE.Actor = undefined;
	private countdownTimer?: Countdown = undefined;
	private assets: MRE.AssetContainer;

	// Number of seconds to count initially
	private readonly initialCount: number;

	// Increment to the counter (in seconds) when clicked
	private readonly increment: number;

	private readonly alarmSoundUrl: string;

	constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
		this.initialCount = parseInt(getParameterLastValue(params, 'c', '60'));
		this.increment = parseInt(getParameterLastValue(params, 'i', '60'));
		this.assets = new MRE.AssetContainer(this.context);
		this.alarmSoundUrl = baseUrl + '/alarm.mp3'
		this.context.onStarted(() => this.started());
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private async started() {
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

		const alarmSound = this.assets.createSound(
			'alarm',
			{ 'uri': this.alarmSoundUrl }
		);

		this.countdownTimer = new Countdown(
			this.initialCount,
			(value: string) => {
				if (this.timerContent != undefined) {
					this.timerContent.text.contents = value;
				}
			},
			() => {
				if (this.timerBody != undefined) {
					this.timerBody.startSound(alarmSound.id, {});
				}
			});
		const buttonBehavior = this.timerBody.setBehavior(MRE.ButtonBehavior);
		buttonBehavior.onClick(() => {
			if (this.countdownTimer != undefined) {
				this.countdownTimer.increment(this.increment);
			}
		});
    }
    
}
