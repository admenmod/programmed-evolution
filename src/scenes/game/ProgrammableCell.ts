import { Vector2 } from '@ver/Vector2';
import { Event } from '@ver/events';
import type { Viewport } from '@ver/Viewport';

import type { IGeneReader } from './GenomeExecutionManager';

import { WorldItem } from './World';


export class ProgrammableCell extends WorldItem implements IGeneReader {
	public '@api:budoff' = new Event<ProgrammableCell, [o: ProgrammableCell]>(this);
	public '@api:dead' = new Event<ProgrammableCell, [o: ProgrammableCell]>(this);


	public energy: number = 20;

	public index: number = 0;
	public api = (() => {
		const self = this;

		type R = Generator<Parameters<ProgrammableCell['readgenome']>[0], void, never>;

		const around = new Array(8).fill('');
		Object.defineProperty(around, 'forward', {
			get() { return (this as any)[self.celldir] as string; },
			enumerable: true, configurable: true
		});

		return {
			console,

			*idle(n: number = 1): R { for(let i = 0; i < n; i++) yield 'idle'; },

			get energy() { return self.energy; },

			get isBudoff() { return self.energy >= 10; },

			*turnLeft(n: number = 1): R { for(let i = 0; i < n; i++) yield 'turn left'; },
			*turnRight(n: number = 1): R { for(let i = 0; i < n; i++) yield 'turn right'; },
			*moveForward(n: number = 1): R { for(let i = 0; i < n; i++) yield 'move forward'; },

			around,

			*lookAround(): R { yield 'look around'; },

			*budoff(): R { yield 'bud off'; }
		};
	})();

	public readgenome(value: 'idle'
		|'move forward'
		|'turn left'
		|'turn right'
		|'look around'
		|'bud off'
		|'self kill'
	): boolean {
		switch(value) {
			case 'idle': {
				this.energy += 1;
				break;
			}
			case 'move forward': {
				if(this.energy < 1) break;
				this.energy -= 1;

				this.moveForward(1);
				break;
			}
			case 'turn left': {
				if(this.energy < 1) break;
				this.energy -= 1;

				this.celldir -= 1;
				break;
			}
			case 'turn right': {
				if(this.energy < 1) break;
				this.energy -= 1;

				this.celldir += 1;
				break;
			}
			case 'look around': {
				if(this.energy < 1) break;
				this.energy -= 1;

				this.api.around[1] = this._world!.getObjectCellUp(this.cellpos.buf().add(-1, -1))?.type || '';
				this.api.around[2] = this._world!.getObjectCellUp(this.cellpos.buf().add(+0, -1))?.type || '';
				this.api.around[3] = this._world!.getObjectCellUp(this.cellpos.buf().add(+1, -1))?.type || '';
				this.api.around[4] = this._world!.getObjectCellUp(this.cellpos.buf().add(+1, +0))?.type || '';
				this.api.around[5] = this._world!.getObjectCellUp(this.cellpos.buf().add(+1, +1))?.type || '';
				this.api.around[6] = this._world!.getObjectCellUp(this.cellpos.buf().add(+0, +1))?.type || '';
				this.api.around[7] = this._world!.getObjectCellUp(this.cellpos.buf().add(-1, +1))?.type || '';
				this.api.around[8] = this._world!.getObjectCellUp(this.cellpos.buf().add(-1, +0))?.type || '';
				break;
			}
			case 'bud off': {
				if(this.energy < 10) break;
				this.energy -= 10;

				this['@api:budoff'].emit(this);
				break;
			}
			case 'self kill': {
				if(this.energy < 10) break;
				this['@api:dead'].emit(this);
				break;
			}
		}

		this.energy += 1;

		return false;
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

		ctx.beginPath();
		ctx.font = '10px arkhip';
		ctx.fillStyle = '#66ff22';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(`${this.index}`, 0, 0);

		ctx.globalAlpha = 0.2;
		ctx.strokeStyle = '#11eeee';
		ctx.strokeRect(-this.size.x/2, -this.size.y/2, this.size.x, this.size.y);
	}
}
