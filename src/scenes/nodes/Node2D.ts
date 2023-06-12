import { Vector2 } from '@ver/Vector2';
import type { Viewport } from '@ver/Viewport';

import { Node } from '@/scenes/Node';
import { CanvasItem } from '@/scenes/CanvasItem';


export const PARENT_CACHE = Symbol('PARENT_CACHE');

export class Node2D extends CanvasItem {
	public set '%position'(v: Vector2) { this.position.set(v); }
	public get '%position'(): Vector2 { return this.position.buf(); }

	public set '%rotation'(v: number) { this.rotation = v; }
	public get '%rotation'(): number { return this.rotation; }

	public set '%scale'(v: Vector2) { this.scale.set(v); }
	public get '%scale'(): Vector2 { return this.scale.buf(); }


	protected [PARENT_CACHE]: Node2D[] = [];


	public positionAsRelative: boolean = true;
	public scaleAsRelative: boolean = true;
	public rotationAsRelative: boolean = true;

	public based_on_camera_isCentred: boolean = true;
	public based_on_camera_position: boolean = true;
	public based_on_camera_rotation: boolean = true;
	public based_on_camera_scale: boolean = true;


	public readonly position = new Vector2();
	public readonly pivot_offset = new Vector2();
	public readonly scale = new Vector2(1, 1);

	protected _rotation: number = 0;
	public get rotation(): number { return this._rotation; }
	public set rotation(v: number) { this._rotation = v; }


	constructor() {
		super();

		const ontree = () => {
			this[PARENT_CACHE].length = 0;
			this[PARENT_CACHE].push(...this.getChainParentsOf(Node2D));
		};

		this['@tree_entered'].on(ontree);
		this['@tree_exiting'].on(ontree);
	}


	public get globalPosition(): Vector2 { return this.getRelativePosition(Node.MAX_NESTING); }
	public get globalScale(): Vector2 { return this.getRelativeScale(Node.MAX_NESTING); }
	public get globalRotation(): number { return this.getRelativeRotation(Node.MAX_NESTING); }


	public getRelativePosition(nl: number = 0, arr: Node2D[] = this[PARENT_CACHE]): Vector2 {
		if(!this.positionAsRelative) return this.position.buf();

		const l = Math.min(nl, arr.length, Node.MAX_NESTING);
		const acc = new Vector2();

		let prev: Node2D = this, next: Node2D | null = null;

		if(!arr.length) acc.add(this.position);

		for(let i = 0; i < l; i++) {
			next = arr[i];

			acc.add(prev.position);

			if(next.rotation !== 0) {
				acc.sub(next.pivot_offset);
				acc.rotate(next.rotation);
				acc.add(next.pivot_offset);
			}

			acc.inc(next.scale);

			if(!arr[i].positionAsRelative) break;

			prev = next;
		}

		if(arr.length) acc.add(arr[arr.length-1].position);

		return acc;
	}

	public getRelativeScale(nl: number = 0, arr: Node2D[] = this[PARENT_CACHE]): Vector2 {
		if(!this.scaleAsRelative) return this.scale.buf();

		const l = Math.min(nl, arr.length, Node.MAX_NESTING);
		const acc = this.scale.buf();

		for(let i = 0; i < l; i++) {
			acc.inc(arr[i].scale);

			if(!arr[i].scaleAsRelative) return acc;
		}

		return acc;
	}

	public getRelativeRotation(nl: number = 0, arr: Node2D[] = this[PARENT_CACHE]): number {
		if(!this.rotationAsRelative) return this.rotation;

		const l = Math.min(nl, arr.length, Node.MAX_NESTING);
		let acc = this.rotation;

		for(let i = 0; i < l; i++) {
			if(arr[i].rotation !== 0) acc += arr[i].rotation;

			if(!arr[i].rotationAsRelative) return acc;
		}

		return acc;
	}


	protected _draw(viewport: Viewport) {}

	protected _render(viewport: Viewport): void {
		viewport.ctx.save();
		viewport.use(this.based_on_camera_position, this.based_on_camera_rotation, this.based_on_camera_scale, this.based_on_camera_isCentred);

		const scale = this.globalScale;
		const pos = this.globalPosition;
		const rot = this.globalRotation;
		const pivot = this.pivot_offset;


		viewport.ctx.translate(pos.x, pos.y);

		if(pivot.x !== 0 || pivot.y !== 0) {
			viewport.ctx.translate(pivot.x, pivot.y);
			viewport.ctx.rotate(rot);
			viewport.ctx.translate(-pivot.x, -pivot.y);
		} else viewport.ctx.rotate(rot);

		viewport.ctx.scale(scale.x, scale.y);

		viewport.ctx.globalAlpha = this.globalAlpha;

		this._draw(viewport);

		viewport.ctx.restore();
	}
}
