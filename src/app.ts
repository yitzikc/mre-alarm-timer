import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { clamp } from 'lodash';

import { Countdown } from './countdown'
import { getParameterLastValue } from './parameter_set_util'

/**
 * The main class of this app. All the logic goes here.
 */
export default class AlarmTimer {
	private rootActor?: MRE.Actor = undefined;
	private countdownTimer?: Countdown = undefined;
	private assets: MRE.AssetContainer;

	// Relative path of the audio file to play as alarm in the public directory
	private readonly alarmSoundPath: string;
	private alarmSound?: MRE.Sound = undefined;
	private soundPlaying?: MRE.MediaInstance = undefined;

	// Number of seconds to count initially
	private readonly initialCount: number;

	// Increment to the counter (in seconds) when clicked
	private readonly increment: number;

	private readonly volume: number;

	private readonly maxVolume = 100.0;

	private readonly viewableByModsOnly: boolean;

	constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
		this.initialCount = parseInt(getParameterLastValue(params, 'c', '60'));
		this.increment = parseInt(getParameterLastValue(params, 'i', '60'));
		this.volume = clamp(parseFloat(getParameterLastValue(params, 'v', '50')), 0, this.maxVolume) / this.maxVolume;
		this.viewableByModsOnly = (getParameterLastValue(params, 'mo', 'n')[0].toLowerCase() == 'y');
		this.alarmSoundPath = getParameterLastValue(params, 'as', 'alarm.ogg');
		this.assets = new MRE.AssetContainer(this.context);
		this.context.onStarted(() => this.started());
		this.context.onUserJoined(user => this.onUserJoined(user));
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
	
		const alarmSoundUri = `${this.baseUrl}/${this.alarmSoundPath}`
		this.alarmSound = this.assets.createSound(
			'alarmSound',
			{ uri: alarmSoundUri });

		this.countdownTimer = new Countdown(
			this.initialCount,
			(value: string) => {
				this.setTimerText(value);
			},
			this.startSound
			);

		if (! this.viewableByModsOnly) {
			await this.createBody();
		}
	}

	private async onUserJoined(user: MRE.User) {
		if (this.viewableByModsOnly) {
			// FIXME: Figure out how the altspacevr-role value is laid out
			// and use some more exact matching
			const isModerator = user.properties["altspacevr-roles"].toLowerCase().includes("moderator");
			if (isModerator) {
				await this.createBody(user.id);
			}
		}
		return;
	}

	private async createBody(exclusiveToUser: MRE.Guid | undefined = undefined) {
		const square = this.assets.createBoxMesh('square', 1.2, 0.5, 0.20);
		let timerBody = MRE.Actor.Create(this.context, {
			actor: {
				name: 'timerBody',
				parentId: this.rootActor!.id,
				exclusiveToUser: exclusiveToUser,
				appearance: { meshId: square.id },
				transform: {
					app: {
						position: { x: 0, y: 0.5, z: 0.2 },
					}
				}
			}
		});
		timerBody.setCollider(MRE.ColliderType.Box, true);

		MRE.Actor.Create(this.context, {
			actor: {
				name: 'timerContent',
				parentId: timerBody.id,
				text: {
					contents: '',
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: { r: 30 / 255, g: 30 / 255, b: 30 / 255 },
					height: 0.3
				},
				transform: {
					local: {
						position: { x: 0, y: 0, z: -timerBody.transform.app.position.z }
					}
				}
			}
		});

		const buttonBehavior = timerBody.setBehavior(MRE.ButtonBehavior);
		buttonBehavior.onClick(() => {
			const soundIsPlaying = (this.soundPlaying != undefined);

			if (soundIsPlaying || ! this.countdownTimer?.isPaused) {
				this.countdownTimer?.pause();
			}
			else if (this.setToInitial) {
				this.countdownTimer?.setValue(this.initialCount)
			}
			else {
				this.countdownTimer?.increment(this.increment);
			}

			this.stopSound();

		});
	}

	private get timerContent(): Array<MRE.Actor> {
		return this.rootActor?.findChildrenByName("timerContent", true) || [];
	}

	private setTimerText = (value: string) => {
		this.timerContent.forEach((tc: MRE.Actor) => {
			tc.text.contents = value;
		})
	}

	private startSound = () => {
		this.stopSound();
		if (this.alarmSound != undefined) {
			this.soundPlaying =
				this.rootActor!.startSound(this.alarmSound.id, { volume: this.volume });
		}
		return
	}

	private stopSound = () => {
		if (this.soundPlaying != undefined) {
			this.soundPlaying.setState({paused: true});
			this.soundPlaying.stop();
			this.soundPlaying = undefined;
		}
		return
	}
}
