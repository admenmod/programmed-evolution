import { Vector2 } from '@ver/Vector2';
import { Viewport } from '@ver/Viewport';

import { Node2D } from '@/scenes/nodes/Node2D';


export class TextNode extends Node2D {
	protected _lines: string[] = [''];
	public get lines() { return this._lines; }

	protected _text: string = '';
	public get text() { return this._text; }
	public set text(v) {
		this._text = v;
		this._lines.length = 0;
		this._lines.push(...this.text.split('\n'));
	}

	protected _color: string = '#eeeeee';
	public get color() { return this._color; }
	public set color(v) { this._color = v; }

	protected linespace: number = 15;


	protected _draw({ ctx }: Viewport): void {
		ctx.beginPath();
		ctx.fillStyle = this.color;
		ctx.font = '15px arkhip';

		const linespace = this.linespace;

		for(let i = 0; i < this._lines.length; i++) {
			ctx.fillText(this._lines[i], 0, linespace * i);
		}

		ctx.restore();
	}
}
