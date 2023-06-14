import { Vector2 } from '@ver/Vector2';
import { Event, EventDispatcher } from '@ver/events';
import { codeShell } from '@ver/codeShell';
import type { Viewport } from '@ver/Viewport';

import { WorldItem } from './World';


type GGG = Generator<
	'idle'|
	'move forward'|
	'turn left'|
	'turn right'|
	'look around'|
	'bud off'
, void, any>;


const delay = (cb: Function, t: number) => new Promise<void>(res => setTimeout(() => {
	cb();
	res();
}, t));


export class ProgramsExecutor extends EventDispatcher {
	public '@start' = new Event<ProgramsExecutor, []>(this);
	public '@stop' = new Event<ProgramsExecutor, []>(this);


	public j: number = 0;
	public l: number = 1000;
	public t: number = 1000;

	public arr: { o: ProgrammableCell, gen: GGG }[] = [];

	public isStarted: boolean = false;

	public start(): void {
		if(this.isStarted) return;
		this.isStarted = true;

		const tick = () => {
			const arr = this.arr;

			if(!arr.length || !this.isStarted) {
				this['@stop'].emit();
				return;
			}

			if(!(this.j < this.l)) return;

			for(let i = 0; i < arr.length; i++) {
				const { value, done } = arr[i].gen.next();

				if(done) {
					arr.splice(i, 1);
					continue;
				}

				switch(value) {
					case 'bud off': arr[i].o.apiBudoff(); break;
					case 'look around': arr[i].o.apiLookAround(); break;
					case 'idle': arr[i].o.apiIdle(); break;
					case 'move forward': arr[i].o.apiMoveForward(); break;
					case 'turn left': arr[i].o.apiTurnLeft(); break;
					case 'turn right': arr[i].o.apiTurnRight(); break;
				}
			}

			this.j += 1;

			delay(tick, this.t);
		}

		this['@start'].emit();

		delay(tick, this.t);
	}

	public stop(): void { this.isStarted = false; }


	public add(o: ProgrammableCell, code: string): void {
		this.arr.push({
			o, gen: codeShell<() => GGG>(code, o._api, { generator: true, source: `gen[${this.arr.length}]` }).call(null)
		});
	}
}


export class ProgrammableCell extends WorldItem {
	public energy: number = 20;

	public _api = (() => {
		const self = this;

		const around = new Array(8).fill('');
		Object.defineProperty(around, 'forward', {
			get() { return (this as any)[self.celldir] as string; },
			enumerable: true, configurable: true
		});

		return {
			console,

			*idle(n: number = 1) { for (let i = 0; i < n; i++) yield 'idle'; },

			get energy() { return self.energy; },

			get isBudoff() { return self.energy >= 10; },

			*turnLeft(n: number = 1) { for (let i = 0; i < n; i++) yield 'turn left'; },
			*turnRight(n: number = 1) { for (let i = 0; i < n; i++) yield 'turn right'; },
			*moveForward(n: number = 1) { for (let i = 0; i < n; i++) yield 'move forward'; },

			around,

			*lookAround() { yield 'look around'; },

			*budoff() { yield 'bud off'; }
		};
	})();

	public apiIdle(): void { this.energy += 1; }
	public apiMoveForward(): void {
		if(this.energy < 1) return;
		this.energy -= 1;

		this.moveForward(1);
	}
	public apiTurnLeft(): void {
		if(this.energy < 1) return;
		this.energy -= 1;

		this.celldir -= 1;
	}
	public apiTurnRight(): void {
		if(this.energy < 1) return;
		this.energy -= 1;

		this.celldir += 1;
	}

	public apiLookAround() {
		if(this.energy < 1) return;
		this.energy -= 1;

		this._api.around[1] = this._world!.getObjectCellUp(this.cellpos.buf().add(-1, -1))?.type || '';
		this._api.around[2] = this._world!.getObjectCellUp(this.cellpos.buf().add(+0, -1))?.type || '';
		this._api.around[3] = this._world!.getObjectCellUp(this.cellpos.buf().add(+1, -1))?.type || '';
		this._api.around[4] = this._world!.getObjectCellUp(this.cellpos.buf().add(+1, +0))?.type || '';
		this._api.around[5] = this._world!.getObjectCellUp(this.cellpos.buf().add(+1, +1))?.type || '';
		this._api.around[6] = this._world!.getObjectCellUp(this.cellpos.buf().add(+0, +1))?.type || '';
		this._api.around[7] = this._world!.getObjectCellUp(this.cellpos.buf().add(-1, +1))?.type || '';
		this._api.around[8] = this._world!.getObjectCellUp(this.cellpos.buf().add(-1, +0))?.type || '';
	}

	public '@api:budoff' = new Event<ProgrammableCell, [o: ProgrammableCell]>(this);
	public apiBudoff() {
		if(this.energy < 10) return;
		this.energy -= 10;

		this['@api:budoff'].emit(this);
	}


	public type = 'life';
	public size = new Vector2(20, 20);

	public move(target: Vector2): void {
		this.tryMoveTo(target);
	}
	public moveForward(n: number): void {
		const v = new Vector2();

		switch(this.celldir) {
			case 1: v.set(-n, -n); break;
			case 2: v.set(0, -n); break;
			case 3: v.set(n, -n); break;
			case 4: v.set(n, 0); break;
			case 5: v.set(n, n); break;
			case 6: v.set(0, n); break;
			case 7: v.set(-n, n); break;
			case 8: v.set(-n, 0); break;
		}

		this.tryMoveTo(v);
	}


	protected _process(this: ProgrammableCell, dt: number): void {
		// this.position.moveTo(this.target, this.speed * dt, true);

		// this.get().Mesh.render(0 as any as CanvasRenderingContext2D);
	}


	protected _draw({ ctx }: Viewport) {
		const c = this.size.x/2;

		ctx.beginPath();
		ctx.fillStyle = '#ee1111';
		ctx.moveTo(0, -c);
		ctx.lineTo(c/2, c);
		ctx.lineTo(0, c/2);
		ctx.lineTo(-c/2, c);
		ctx.closePath();
		ctx.fill();

		ctx.globalAlpha = 0.2;
		ctx.strokeStyle = '#11eeee';
		ctx.strokeRect(-this.size.x/2, -this.size.y/2, this.size.x, this.size.y);
	}
}
