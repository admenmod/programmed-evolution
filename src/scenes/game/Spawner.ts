import { Vector2 } from '@ver/Vector2';
import type { Viewport } from '@ver/Viewport';

import { WorldItem } from './World';


export class Spawner extends WorldItem {
	public size = new Vector2(20, 20);


	protected _process(this: Spawner, dt: number): void {
		// this.position.moveTo(this.target, this.speed * dt, true);

		// this.get().Mesh.render(0 as any as CanvasRenderingContext2D);
	}


	protected _draw({ ctx }: Viewport) {
		ctx.beginPath();
		ctx.fillStyle = '#eeee33';
		ctx.arc(0, 0, this.size.x/2, 0, Math.PI*2);
		ctx.fill();
	}
}
