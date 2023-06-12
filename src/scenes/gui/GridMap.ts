import type { Viewport } from '@ver/Viewport';

import { Node2D } from '@/scenes/nodes/Node2D';
import { Vector2 } from '@ver/Vector2';
import { gm } from '@/global';


export class GridMap extends Node2D {
	public offset = new Vector2();
	public tile = new Vector2(50, 50);
	public size = new Vector2().set(gm.viewport.size);
	public scale = new Vector2(1, 1);

	public lineWidth: number = 0.2;
	public lineColor: string = '#ffffff';

	public coordinates: boolean = false;


	protected _draw(viewport: Viewport): void {
		this.size.set(viewport.size).div(viewport.scale);
		if(viewport.rotation !== 0) this.size.inc(2);

		this.offset.set(viewport.position.buf().sub(this.size.buf().div(2)));

		const vpos = viewport.position.buf();
		const tile = this.tile.buf().inc(this.scale);

		const mar = vpos.buf().mod(tile);
		const counts = this.size.buf().add(mar).div(tile);

		const ctx = viewport.ctx;
		// clip area
		ctx.beginPath();
		ctx.rect(this.offset.x, this.offset.y, this.size.x, this.size.y);
		ctx.clip();


		// draw grid
		ctx.beginPath();
		if(this.lineWidth < 1) {
			ctx.globalAlpha = this.lineWidth;
			ctx.lineWidth = 1;
		} else ctx.lineWidth = this.lineWidth;

		ctx.strokeStyle = this.lineColor;

		for(let dx = vpos.x > 1 ? 1:0; dx < counts.x; dx++) {
			const x = this.offset.x - mar.x + dx*tile.x;
			ctx.moveTo(x, this.offset.y);
			ctx.lineTo(x, this.offset.y + this.size.y);
		}

		for(let dy = vpos.y > 1 ? 1:0; dy < counts.y; dy++) {
			const y = this.offset.y - mar.y + dy*tile.y;
			ctx.moveTo(this.offset.x, y);
			ctx.lineTo(this.offset.x + this.size.x, y);
		}

		ctx.stroke();


		// area stroke
		ctx.beginPath();
		ctx.strokeStyle = '#44ff44';
		ctx.strokeRect(this.offset.x, this.offset.y, this.size.x, this.size.y);


		// coordinates
		if(this.coordinates) {
			const pad = new Vector2(10, 10);

			ctx.beginPath();
			ctx.fillStyle = '#ffff00';
			ctx.globalAlpha = 0.4;

			for(let dx = -1; dx < counts.x; dx++) {
				const coordinates = Math.floor((vpos.x*1.01 + dx*tile.x) / tile.x) * tile.x;
				ctx.fillText(coordinates.toFixed(0), this.offset.x + 2 - mar.x + dx*tile.x, this.offset.y + pad.y);
			};

			for(let dy = -1; dy < counts.y; dy++) {
				const coordinates = Math.floor((vpos.y*1.01 + dy*tile.y) / tile.y) * tile.y;
				ctx.fillText(coordinates.toFixed(0), this.offset.x + 2, this.offset.y + pad.y - mar.y + dy*tile.y);
			}
		}
	}
}
