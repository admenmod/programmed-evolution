import { Vector2 } from '@ver/Vector2';
import type { Viewport } from '@ver/Viewport';

import { WorldItem } from './World';


export class WallCell extends WorldItem {
	public type = 'wall';

	public size = new Vector2(20, 20);


	protected _draw({ ctx }: Viewport) {
		ctx.beginPath();
		ctx.strokeStyle = '#113333';
		ctx.strokeRect(-this.size.x/2, -this.size.y/2, this.size.x, this.size.y);
	}
}
