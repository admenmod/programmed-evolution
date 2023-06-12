import { Vector2 } from '@ver/Vector2';
import type { Viewport } from '@ver/Viewport';

import { Node2D } from './Node2D';


export class Camera2D extends Node2D {
	public _current: boolean = false;
	public get current(): boolean { return this._current; }
	public set current(v: boolean) { this._current = v; }

	public viewport: Viewport | null = null;


	protected _process(dt: number): void {
		if(this.viewport && this.current) {
			this.viewport.position.set(this.globalPosition);
			this.viewport.scale.set(this.globalScale);
			this.viewport.rotation = this.globalRotation;
		}
	}
}
