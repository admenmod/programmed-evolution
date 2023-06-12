import { Vector2 } from '@ver/Vector2';
import { roundLoop } from '@ver/helpers';
import type { Viewport } from '@ver/Viewport';
import type { Touch } from '@ver/TouchesController';

import { Node2D } from '@/scenes/nodes/Node2D';
import { Input } from '@/global';


export class Joystick extends Node2D {
	public core_offset = new Vector2();

	public radius0: number = 70;
	public coreRadius0: number = 50;
	public colors0 = [0, '#112233', 1, '#223344'];

	public radius1: number = 30;
	public coreRadius1: number = 5;
	public colors1 = [0, '#223344', 1, '#112233'];

	private _angle: number = 0;
	public angle_offset: number = 0;

	public touch: Touch | null = null;

	public get value(): number { return this.core_offset.module / (this.radius0-this.radius1); }
	public get angle(): number {
		return this._angle = this.value ? roundLoop(this.core_offset.angle + this.angle_offset) : this._angle;
	}


	protected async _init(this: Joystick): Promise<void> {
		const fnpress = Input.on('press', (tpos, _, touch) => {
			if(!this.touch && this.globalPosition.getDistance(tpos) < this.radius0) {
				this.touch = touch;
			}

			if(this.touch === touch) {
				const pos = this.globalPosition;
				const l = pos.getDistance(tpos);

				this.core_offset.set(new Vector2().moveAngle(
					Math.min(l, this.radius0-this.radius1),
					pos.getAngleRelative(tpos) - this.globalRotation
				));
			}
		});

		const fnup = Input.on('up', (tpos, _, touch) => {
			if(this.touch === touch) this.touch = null;
		});

		const fnmove = Input.on('move', (tpos, _, touch) => {
			if(this.touch === touch) {
				const pos = this.globalPosition;
				const l = pos.getDistance(tpos);

				this.core_offset.set(new Vector2().moveAngle(
					Math.min(l, this.radius0-this.radius1),
					pos.getAngleRelative(tpos) - this.globalRotation
				));
			}
		});

		this.on('destroy', () => {
			Input.off('press', fnpress);
			Input.off('up', fnup);
			Input.off('move', fnmove);
		});
	}

	protected _process(): void {
		if(!this.touch) this.core_offset.moveTime(Vector2.ZERO, 3);
	}

	protected _draw(viewport: Viewport): void {
		const ctx = viewport.ctx;

		ctx.globalAlpha = 0.7;
		ctx.beginPath();

		let grd = ctx.createRadialGradient(0, 0, this.coreRadius0, 0, 0, this.radius0);

		for(let i = 0; i < this.colors0.length; i += 2) {
			grd.addColorStop(this.colors0[i] as number, this.colors0[i+1] as string);
		}

		ctx.fillStyle = grd;
		ctx.arc(0, 0, this.radius0, 0, Math.PI*2);
		ctx.fill();

		ctx.beginPath();
		grd = ctx.createRadialGradient(
			this.core_offset.x, this.core_offset.y, this.coreRadius1,
			this.core_offset.x, this.core_offset.y, this.radius1
		);

		for(let i = 0; i < this.colors1.length; i += 2) {
			grd.addColorStop(this.colors1[i] as number, this.colors1[i+1] as string);
		}

		ctx.fillStyle = grd;
		ctx.arc(this.core_offset.x, this.core_offset.y, this.radius1, 0, Math.PI*2);
		ctx.fill();
	}
}
