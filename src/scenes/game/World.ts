import { Vector2 } from '@ver/Vector2';
import { Event } from '@ver/events';
import { roundLoop } from '@ver/helpers';

import { Date } from '@/modules/Date';
import { Node } from '@/scenes/Node';
import { Node2D } from '@/scenes/nodes/Node2D';


export class World extends Node {
	public '@start' = new Event<World, []>(this);
	public '@stop' = new Event<World, []>(this);


	public size = new Vector2();
	public cellsize = new Vector2(20, 20);

	public all_nodes: WorldItem[] = [];


	public enter_date: Date = new Date();
	public date: Date = new Date();

	constructor() {
		super();

		this['@child_entered_tree'].on(s => s instanceof WorldItem && this.addItem(s));
		this['@child_exiting_tree'].on(s => s instanceof WorldItem && this.removeItem(s));
	}

	public getObjectCellUp(target: Vector2): WorldItem | null{
		return this.all_nodes.find(i => i.cellpos.isSame(target)) || null;
	}

	public addItem(o: WorldItem): void {
		//@ts-ignore friend
		if(o._isInTree) return;

		//@ts-ignore friend
		o._isInTree = true;
		//@ts-ignore friend
		o._world = this;

		o.position.set(o.cellpos.buf().inc(this.cellsize));
		//@ts-ignore friend
		o._enter_world(this);
		o.emit('enter_world', this);

		this.all_nodes.push(o);

		o.visible = true;
	}

	public removeItem(o: WorldItem): void {
		//@ts-ignore
		if(!o._isInTree) return;

		//@ts-ignore friend
		o._isInTree = false;
		//@ts-ignore friend
		o._world = null;
		//@ts-ignore friend
		o._exit_world(this);
		o.emit('exit_world', this);

		const l = this.all_nodes.indexOf(o);
		if(~l) this.all_nodes.splice(l, 1);

		o.visible = false;
	}

	public hasNodeMovedTo(node1: WorldItem, target: Vector2): boolean {
		const l = target.module;

		if(l > 2) return false;

		for(let i = 0; i < this.all_nodes.length; i++) {
			const diff = this.all_nodes[i].cellpos.buf().sub(node1.cellpos.buf().add(target));

			if(diff.isSame(Vector2.ZERO) && this.all_nodes[i].zN >= node1.zN) return false;
		}

		this.date.setSeconds(this.date.getSeconds() + 3);

		return true;
	}

	public getDistance(node1: WorldItem, node2: WorldItem): number {
		return node1.cellpos.getDistance(node2.cellpos);
	}
}


export class WorldItem extends Node2D {
	public '@enter_world' = new Event<WorldItem, [world: World]>(this);
	public '@exit_world' = new Event<WorldItem, [world: World]>(this);

	protected _enter_world(world: World): void {}
	protected _exit_world(world: World): void {}

	public type: string = 'unknown';
	public zN: number = 0;

	public cellpos = new Vector2();

	protected _celldir:
		1|2|3|
		8 | 4|
		7|6|5 = 2;
	public get celldir() { return this._celldir; }
	public set celldir(v: number) {
		this._celldir = roundLoop(v, 1, 9) as WorldItem['_celldir'];

		const p = Math.PI/4;
		switch(this._celldir) {
			case 1: this.rotation = -p; break;
			case 2: this.rotation = 0; break;
			case 3: this.rotation = p; break;
			case 4: this.rotation = p*2; break;
			case 5: this.rotation = p*3; break;
			case 6: this.rotation = p*4; break;
			case 7: this.rotation = -p*3; break;
			case 8: this.rotation = -p*2; break;
		}
	}

	protected _world: World | null = null;


	public tryMoveTo(target: Vector2): boolean {
		if(!this._world) return false;

		const has = this._world!.hasNodeMovedTo(this, target);

		if(has) {
			this.cellpos.add(target);
			this.position.set(this.cellpos.buf().inc(this._world!.cellsize));
		}

		return has;
	}
}
