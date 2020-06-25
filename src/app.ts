import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { clamp } from 'lodash';

import { Countdown } from './countdown'
import { getParameterLastValue, getBooleanOption } from './parameter_set_util'

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
	private readonly audioOptions: MRE.SetAudioStateOptions;

	// Number of seconds to count initially
	private readonly initialCount: number;

	// Increment to the counter (in seconds) when clicked
	private readonly increment: number;

	private readonly maxVolume = 100.0;

	private readonly viewableByModsOnly: boolean;
	private readonly pauseOnly: boolean;
	private isPaused: boolean = false;

	constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
		this.initialCount = parseInt(getParameterLastValue(params, 'c', '60'));
		this.increment = parseInt(getParameterLastValue(params, 'i', '60'));
		this.viewableByModsOnly = getBooleanOption(params, 'mo', false);
		this.alarmSoundPath = getParameterLastValue(params, 'as', 'alarm.ogg');
		this.pauseOnly = getBooleanOption(params, 'p', false);
		this.audioOptions = this.getAudioOptions(params);
		this.assets = new MRE.AssetContainer(this.context);
		this.context.onStarted(() => this.started());
		this.context.onUserJoined(user => this.onUserJoined(user));
	}

	private getAudioOptions = (params: MRE.ParameterSet): MRE.SetAudioStateOptions =>  {
		const volume = clamp(
			parseFloat(getParameterLastValue(params, 'v', '50')),
			0,
			this.maxVolume
		) / this.maxVolume;
		const looping = getBooleanOption(params, 'l', false);
		let options: MRE.SetAudioStateOptions = { volume: volume, looping: looping };

		const ambient = getBooleanOption(params, 'am', false);
		if (ambient) {
			options.doppler = 0;
			options.spread = 0;
			options.rolloffStartDistance = 100;
		}

		// Always start from the beginning
		options.time = 0;

		return options;
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
	
		let alarmSoundUri = decodeURIComponent(this.alarmSoundPath);
		if( !alarmSoundUri.startsWith("http://") && !alarmSoundUri.startsWith("https://") ) {
			alarmSoundUri = `${this.baseUrl}/${this.alarmSoundPath}`;
		}
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
			const soundIsPlaying = (this.soundPlaying != undefined) && !this.isPaused;

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
		if (!this.pauseOnly) {
			this.stopSound();
		}
		if (this.alarmSound != undefined) {
			this.soundPlaying =
				this.rootActor!.startSound(this.alarmSound.id, this.audioOptions);
		} else if (this.pauseOnly) {
			this.soundPlaying?.setState({paused: false});
			this.soundPlaying?.resume();
			this.isPaused = false;
		}
		return
	}

	private stopSound = () => {
		if (this.soundPlaying != undefined) {
			if (this.pauseOnly) {
				this.soundPlaying.setState({paused: true});
				this.soundPlaying.pause();
				this.isPaused = true;
				return;
			}
			this.soundPlaying.setState({paused: true, time: 0});
			this.soundPlaying.stop();
			this.soundPlaying = undefined;
		}
		return
	}
}
