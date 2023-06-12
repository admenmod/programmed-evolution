import { Vector2, vec2 } from '@ver/Vector2';
import { Event, EventDispatcher } from '@ver/events';
import { Viewport } from '@ver/Viewport';
import type { TouchesController, Touch } from '@ver/TouchesController';


export class SensorCamera extends EventDispatcher {
	public '@scale' = new Event<SensorCamera, [Vector2]>(this);


	public touch1: Touch | null = null;
	public touch2: Touch | null = null;

	public fix = {
		pos: new Vector2(),
		scale: new Vector2(),
		position: new Vector2(),
		center: new Vector2()
	};

	constructor(public viewport: Viewport) {
		super();

		this.fix.scale = this.viewport.scale.buf();
		this.fix.position = this.viewport.position.buf();
	}

	public update(dt: number, touches: TouchesController) {
		if(this.touch1?.pos.isSame(Vector2.ZERO) || this.touch2?.pos.isSame(Vector2.ZERO)) return console.log('error');

		if(this.touch1 = touches.findTouch(t => t.id === 0) || this.touch1) {
			if(this.touch2 = touches.findTouch(t => t.id === 1) || this.touch2) {
				let centerTouches = this.touch1.pos.buf().sub(this.touch2.pos).abs();
				const center = this.viewport.position.buf().add(this.touch1.pos.buf().add(this.touch2.pos).div(2));

				if(this.touch2.isPress()) {
					this.fix.pos = this.touch1.pos.buf().sub(this.touch2.pos).abs();
					this.fix.scale.set(this.viewport.scale);
					this.fix.position.set(this.viewport.position);

					this.fix.center.set(this.fix.position.buf().add(this.touch1.pos.buf().add(this.touch2.pos).div(2)));
				}

				this.viewport.scale.set(this.fix.scale.buf().inc((centerTouches.module / this.fix.pos.module)));
				// this.position.set(center.buf().sub(this.fix.center));

				(this as SensorCamera).emit('scale', this.viewport.scale);


				if(this.touch2.isUp()) this.touch1 = this.touch2 = null;
			}

			if(this.touch1?.isUp()) this.touch1 = this.touch2 = null;
		}
	}
}
