import { Event } from '@ver/events';
import { Scene } from '@ver/Scene';
import { System } from '@ver/System';
import { TouchesController } from '@ver/TouchesController';


export class ProcessSystem extends System<typeof Node> {
	constructor() {
		super(Node);

		const processPriority = () => this._items.sort(this._sort);

		this['@add'].on(item => {
			item.on('change%processPriority', processPriority);
			processPriority();
		});

		this['@removing'].on(item => item.off('change%processPriority', processPriority));
	}

	public _sort(a: Node, b: Node): number { return a.processPriority - b.processPriority; }

	public input() {}

	public update(dt: number) {
		for(let i = 0; i < this._items.length; i++) {
			this._items[i].process(dt);
		}
	}
}


const PARENT_CACHE = Symbol('PARENT_CACHE');

export class Node extends Scene {
	public set '%name'(v: string) { this.name = v; }
	public get '%name'(): string { return this.name; }


	protected [PARENT_CACHE]: Node[] = [];

	public '@change%processPriority' = new Event<Node, [Node]>(this);

	private _processPriority: number = 0;
	public get processPriority() { return this._processPriority; }
	public set processPriority(v) {
		this._processPriority = v;
		this['@change%processPriority'].emit(this);
	}


	constructor() {
		super();

		const ontree = () => {
			this[PARENT_CACHE].length = 0;
			this[PARENT_CACHE].push(...this.getChainParentsOf(Node));
		};

		ontree();

		this['@tree_entered'].on(ontree);
		this['@tree_exiting'].on(ontree);
	}

	protected _input(): void {}

	public input(): void {
		this._input();
	}

	protected _process(dt: number): void {}

	public process(dt: number): void {
		this._process(dt);
	}

	public static readonly MAX_NESTING = 10000;
}
