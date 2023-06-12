import { Vector2 } from '@ver/Vector2';
import { EventDispatcher, Event } from '@ver/events';
import { TouchesController, Touch } from '@ver/TouchesController';
import { MainLoop } from '@ver/MainLoop';
import { Viewport } from '@ver/Viewport';
import { HTMLCanvasLayersElement } from '@ver/HTMLCanvasLayersElement';

import { Node } from '@/scenes/Node';
import { MainScene } from '@/scenes/MainScene';

import { ProcessSystem } from '@/scenes/Node';
import { RenderSystem } from '@/scenes/CanvasItem';
import { PhysicsBox2DSystem } from '@/scenes/PhysicsBox2DItem';


export const appElement = document.querySelector<HTMLDivElement>('#app');
if(!appElement) throw new Error('app is not found');

export const canvas = new HTMLCanvasLayersElement();
appElement.append(canvas);
//@ts-ignore
canvas.ondblclick = () => canvas.webkitRequestFullscreen();


export const layers: Record<string, CanvasRenderingContext2D>= {};

for(let id in canvas.layers) {
	layers[id] = canvas.layers[id].getContext('2d')!;
}


export const touches = new TouchesController(canvas);


export const gm = new class GameManager extends EventDispatcher {
	public '@resize' = new Event<GameManager, [Vector2]>(this);
	public '@camera.scale' = new Event<GameManager, [Vector2]>(this);

	public main_layer = layers.main;

	public viewport: Viewport;

	public get screen() { return new Vector2(this.main_layer.canvas.width, this.main_layer.canvas.height); }

	public root!: Node;

	public stats: Record<string, string> = {};

	constructor() {
		super();

		this.viewport = new Viewport(layers.main);
		this.viewport.size.set(canvas.size);

		canvas['@resize'].on(size => {
			this.viewport.size.set(size);

			this['@resize'].emit(size);
		});
	}
}


export const Input = new class Input extends EventDispatcher {
	public '@press' = new Event<this, [pos: Vector2, local: Vector2, touch: Touch]>(this);
	public '@up' = new Event<this, [pos: Vector2, local: Vector2, touch: Touch]>(this);
	public '@move' = new Event<this, [pos: Vector2, local: Vector2, touch: Touch]>(this);

	constructor() {
		super();

		touches['@touchstart'].on(t => {
			const pos = gm.viewport.transformFromScreenToViewport(t.pos.buf());
			const local = gm.viewport.transformToLocal(t.pos.buf());
			this['@press'].emit(pos, local, t);
		});
		touches['@touchend'].on(t => {
			const pos = gm.viewport.transformFromScreenToViewport(t.pos.buf());
			const local = gm.viewport.transformToLocal(t.pos.buf());
			this['@up'].emit(pos, local, t);
		});
		touches['@touchmove'].on(t => {
			const pos = gm.viewport.transformFromScreenToViewport(t.pos.buf());
			const local = gm.viewport.transformToLocal(t.pos.buf());
			this['@move'].emit(pos, local, t);
		});
	}
}


export const mainLoop = new MainLoop();


export const processSystem = new ProcessSystem();
export const renderSystem = new RenderSystem();
export const physicsBox2DSystem = new PhysicsBox2DSystem();

mainLoop.on('update', dt => processSystem.update(dt), 25);
mainLoop.on('update', dt => renderSystem.update(gm.viewport), 50);
mainLoop.on('update', dt => touches.nullify(dt), 10000);
mainLoop.on('update', dt => physicsBox2DSystem.update(16), 20);


(async () => {
	await Node.load();
	await MainScene.load();

	gm.root = new Node();
	await gm.root.init();

	const main_scene = new MainScene();
	await main_scene.init();

	processSystem.addRoot(gm.root);
	renderSystem.addRoot(gm.root);
	physicsBox2DSystem.addRoot(gm.root);

	gm.root.addChild(main_scene);

	mainLoop.start();
})();
