import { Event, EventDispatcher } from '@ver/events';
import { codeShell } from '@ver/codeShell';
import { delay } from '@ver/helpers';


export interface IGeneReader {
	index: number;
	api: object;
	readgenome(value: any): boolean;
}


export class GenomeExecutionManager<Item extends IGeneReader> extends EventDispatcher {
	public '@start' = new Event<GenomeExecutionManager<Item>, []>(this);
	public '@stop' = new Event<GenomeExecutionManager<Item>, []>(this);
	public '@step' = new Event<GenomeExecutionManager<Item>, []>(this);

	public '@readgenome' = new Event<GenomeExecutionManager<Item>, [o: Item, value: Parameters<Item['readgenome']>[0]]>(this);


	public j: number = 0;
	public l: number = 1000;
	public t: number = 1000;

	public items: Item[] = [];
	public genomes = new WeakMap<Item, Generator<Parameters<Item['readgenome']>[0], void, never>>();

	public isStarted: boolean = false;

	public start(): void {
		if(this.isStarted) return;
		this.isStarted = true;

		const tick = () => {
			if(!this.items.length || !this.isStarted) {
				this['@stop'].emit();
				return;
			}

			if(!(this.j < this.l)) return;

			for(let i = 0; i < this.items.length; i++) {
				let r = false;

				do {
					const { value, done } = this.genomes.get(this.items[i])!.next();

					if(done) {
						this.del(this.items[i]);
						break;
					}

					r = this.items[i].readgenome(value);

					this['@readgenome'].emit(this.items[i], value);
				} while(r);
			}

			this.j += 1;

			delay(tick, this.t);
		}

		this['@start'].emit();

		delay(tick, this.t);
	}

	public stop(): void { this.isStarted = false; }


	public add(o: Item, code: string): void {
		if(this.items.includes(o)) return;

		this.genomes.set(o, codeShell<() => any>(code, o.api, {
			generator: true,
			source: `gen[${this.items.length}]`
		}).call(null));

		o.index = this.items.length;

		this.items.push(o);
	}

	public del(o: Item): void {
		const i = this.items.indexOf(o);
		if(~i) return;

		this.genomes.get(o)!.return(void 0);
		this.genomes.delete(o);
		this.items.splice(i, 1);
	}
}
