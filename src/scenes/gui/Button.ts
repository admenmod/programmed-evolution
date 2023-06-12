import { Vector2 } from '@ver/Vector2';
import { Event } from '@ver/events';
import type { Viewport } from '@ver/Viewport';
import type { Touch } from '@ver/TouchesController';
import { Node2D } from '@/scenes/nodes/Node2D';

import { Input } from '@/global';


export class Button extends Node2D {
	public '@pressed' = new Event<Button, []>(this);


	protected _text: string = '';
	public get text() { return this._text; }
	public set text(v) { this._text = v; }

	public size = new Vector2(120, 30);

	public style: Partial<CSSStyleRule['style']> = {};

	protected async _init(this: Button): Promise<void> {
		await super._init();

		const fn = Input.on('press', tpos => {
			const pos = this.globalPosition;
			const size = this.size;

			if(
				tpos.x < pos.x + size.x/2 && tpos.x > pos.x - size.x/2 &&
				tpos.y < pos.y + size.y/2 && tpos.y > pos.y - size.y/2
			) this['@pressed'].emit();
		});

		this.on('destroy', () => Input.off('press', fn));
	}

	protected _process(dt: number): void {
		;
	}

	protected _draw(viewport: Viewport): void {
		const ctx = viewport.ctx;

		ctx.beginPath();
		ctx.fillStyle = this.style.background || '#222222';
		ctx.fillRect(-this.size.x/2, -this.size.y/2, this.size.x, this.size.y);

		ctx.beginPath();
		ctx.strokeStyle = this.style.borderColor || '#339933';
		ctx.strokeRect(-this.size.x/2, -this.size.y/2, this.size.x, this.size.y);

		ctx.beginPath();
		ctx.fillStyle = this.style.color || '#eeeeee';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = `${this.style.fontSize || '15px'} ${this.style.fontFamily || 'arkhip,monospace'}`;
		ctx.fillText(this._text, 0, 0);

		ctx.restore();
	}
}
