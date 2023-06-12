import { Vector2 } from '@ver/Vector2';
import { Event } from '@ver/events';
import type { Viewport } from '@ver/Viewport';

import { Node2D } from './Node2D';
import { loadImage } from '@ver/helpers';


type Image = InstanceType<typeof Image>;


export class Sprite extends Node2D {
	protected image?: Image;

	public get src() { return this.image?.src || ''; }
	public get width() { return this.image?.naturalWidth || 0; }
	public get height() { return this.image?.naturalHeight || 0; }

	public offset = new Vector2();
	public offset_angle: number = 0;
	public size = new Vector2();


	public async load(...args: Parameters<typeof loadImage>): Promise<void> {
		this.image = await loadImage(...args);
		this.size.set(this.width, this.height);
	}

	protected _draw({ ctx }: Viewport): void {
		if(!this.image) return;

		if(this.offset_angle !== 0) ctx.rotate(this.offset_angle);

		ctx.drawImage(this.image,
			this.offset.x - this.size.x/2, this.offset.y -this.size.y/2,
			this.size.x, this.size.y
		);
	}
}
