import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Countdown } from './countdown'

/**
 * The main class of this app. All the logic goes here.
 */
export default class AlarmTimer {
	private timerBody: MRE.Actor = null;
	private timerContent: MRE.Actor = null;
	private countdownTimer?: Countdown = null;
	private assets: MRE.AssetContainer;

	constructor(private context: MRE.Context, private baseUrl: string) {
		this.context.onStarted(() => this.started());
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private async started() {
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

		this.countdownTimer = new Countdown(
			60,
			(value: string) => { this.timerContent.text.contents = value; });
		const buttonBehavior = this.timerBody.setBehavior(MRE.ButtonBehavior);
		buttonBehavior.onClick(() => {
			this.countdownTimer.increment(60);
		});
    }
    
}
