import assert = require("assert");
import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { clamp } from 'lodash';

import { Countdown } from './countdown'
import { PlayingMedia } from './playing-media'
import { getParameterLastValue, getBooleanOption } from './parameter-set-util'

interface buttonConfig {
	caption: string,
	rotationDeg: number,
	clickHandler: () => void
};

/**
 * The main class of this app. All the logic goes here.
 */
export default class AlarmTimer {
	private rootActor?: MRE.Actor = undefined;
	private countdownTimer?: Countdown = undefined;
	private assets: MRE.AssetContainer;

	// Specific assets and their properties
	private readonly buttonSquare: MRE.Mesh;
	private readonly buttonDefaultLocalTransform: MRE.Vector3Like = {
		x: 0, y: 0, z: -0.2
	};
	private readonly commonTextProperties: Partial<MRE.TextLike>;

	// Relative path of the audio file to play as alarm in the public directory
	private readonly alarmSoundPath: string;
	private alarmSound?: MRE.Sound = undefined;
	private soundPlaying: PlayingMedia;
	private readonly audioOptions: MRE.SetAudioStateOptions;

	// Number of seconds to count initially
	private readonly initialCount: number;

	// Increment to the counter (in seconds) when clicked
	private readonly increment: number;

	private readonly maxVolume = 100.0;
	private readonly volumeIncrementPercent: number = 10.0;

	private readonly viewableByModsOnly: boolean;
	private readonly pauseOnly: boolean;

	constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
		this.initialCount = parseInt(getParameterLastValue(params, 'c', '60'));
		this.increment = parseInt(getParameterLastValue(params, 'i', '60'));
		this.viewableByModsOnly = getBooleanOption(params, 'mo', false);
		this.alarmSoundPath = getParameterLastValue(params, 'as', 'alarm.ogg');
		this.pauseOnly = getBooleanOption(params, 'p', false);
		this.audioOptions = this.getAudioOptions(params);
		this.soundPlaying = new PlayingMedia();
		this.assets = new MRE.AssetContainer(this.context);
		this.context.onStarted(() => this.started());
		this.context.onUserJoined(user => this.onUserJoined(user));

		// Initialize assets
		this.buttonSquare = this.assets.createBoxMesh('buttonSquare', 0.25, 0.25, 0.2);
		this.commonTextProperties = {
			justify: MRE.TextJustify.Center,
			font: MRE.TextFontFamily.SansSerif,
			anchor: MRE.TextAnchorLocation.MiddleCenter,
			color: MRE.Color3.FromInts(30, 30, 30)
		};
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
		const textRectangle = this.assets.createBoxMesh('textRectangle', 1.2, 0.5, 0.20);
		let timerBody = MRE.Actor.Create(this.context, {
			actor: {
				name: 'timerBody',
				parentId: this.rootActor!.id,
				exclusiveToUser: exclusiveToUser,
				appearance: { meshId: textRectangle.id },
				transform: {
					app: {
						position: { x: 0, y: 0.5, z: -this.buttonDefaultLocalTransform.z },
					}
				}
			}
		});
		timerBody.setCollider(MRE.ColliderType.Box, true);

		MRE.Actor.Create(this.context, {
			actor: {
				name: 'timerContent',
				parentId: timerBody.id,
				text: Object.assign({}, this.commonTextProperties, {
					contents: '',
					height: 0.3
				}),
				transform: {
					local: {
						position: { x: 0, y: 0, z: -timerBody.transform.app.position.z }
					}
				}
			}
		});

		const buttonBehavior = timerBody.setBehavior(MRE.ButtonBehavior);
		buttonBehavior.onClick(() => {
			const soundIsPlaying = this.soundPlaying.isLoaded && !this.soundPlaying.isPaused;

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

		const buttonConfigs: Array<buttonConfig> = [
			{
				caption: ">",
				rotationDeg: 0,
				clickHandler: this.startSound
			}, {
				caption: "=",
				rotationDeg: 90,
				clickHandler: this.stopSound
			}, {
				caption:  "^",
				rotationDeg: 0,
				clickHandler: () => {
					this.soundPlaying.changeVolume(this.volumeIncrementPercent);
				}
			}, {
				caption: "^",
				rotationDeg: 180,
				clickHandler: () => {
					this.soundPlaying.changeVolume(-this.volumeIncrementPercent);
				}
			}
		];
		for (let i = 0; i < buttonConfigs.length; i++) {
			this.createButton(
				buttonConfigs[i],
				i,
				{ exclusiveToUser: exclusiveToUser });
		}

		return;
	}

	private createButton = (
		config: buttonConfig,
		position: number,
		actorProperties: Partial<MRE.ActorLike>
	): MRE.Actor => {
		const button = MRE.Actor.Create(this.context, {
			actor: Object.assign({
				name: `button${position}`,
				parentId: this.rootActor!.id,
				appearance: { meshId: this.buttonSquare.id },
				transform: {
					app: {
						position: Object.assign({},
							this.buttonDefaultLocalTransform,
							{ x: position * 0.3 - 0.5 }
						),
					}
				}
			}, actorProperties),
		});
		button.setCollider(MRE.ColliderType.Box, true);

		MRE.Actor.Create(this.context, {
			actor: {
				name: `button${position}Caption`,
				parentId: button.id,
				text: Object.assign({}, this.commonTextProperties, {
					contents: config.caption,
					height: 0.2
				}),
				transform: {
					local: {
						position: Object.assign({}, this.buttonDefaultLocalTransform, { x: 0, y: 0 }),
						rotation: MRE.Quaternion.FromEulerAngles(0, 0, Math.PI * config.rotationDeg / 180.0)
					}
				}
			}
		});

		const buttonBehavior = button.setBehavior(MRE.ButtonBehavior);
		buttonBehavior.onClick(config.clickHandler);
		return button;
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
		if (this.soundPlaying.isLoaded) {
			if (this.pauseOnly) {
				this.soundPlaying.resume();
				return;
			}
			else {
				this.soundPlaying.stop();
			}
		}

		assert (!this.soundPlaying.isLoaded);
		if (this.alarmSound != undefined) {
			const playOptions = Object.assign({time: 0}, this.audioOptions)
			this.soundPlaying = new PlayingMedia(
				this.rootActor!.startSound(this.alarmSound.id, playOptions),
				playOptions);
		}

		return
	}

	private stopSound = () => {
		if (this.pauseOnly) {
			this.soundPlaying.pause();
		}
		else {	
			this.soundPlaying.stop();
		}
		return
	}
}
