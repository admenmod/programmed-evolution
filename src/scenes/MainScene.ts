import { Vector2 } from '@ver/Vector2';
import { Event } from '@ver/events';
import type { Viewport } from '@ver/Viewport';

import { MapParser } from '@ver/MapParser';
import { KeyboardInputInterceptor } from '@ver/KeyboardInputInterceptor';
import { KeymapperOfActions, MappingsMode } from '@ver/KeymapperOfActions';
import { MotionByTouch } from '@/modules/MotionByTouch';

import { Node } from '@/scenes/Node';
import { TileMap } from '@/scenes/nodes/TileMap';
import { Popup, PopupContainer } from '@/scenes/nodes/Popup';
import { World } from './game/World';
import { ProgramsExecutor, ProgrammableCell } from './game/ProgrammExecutor';
import { WallCell } from './game/WallCell';

import { GridMap } from '@/scenes/gui/GridMap';
import { SystemInfo } from '@/scenes/gui/SystemInfo';
import { canvas, gm, touches } from '@/global';

import { TextNode } from '@/scenes/gui/TextNode';


import * as monaco from 'monaco-editor';

import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'

// @ts-ignore
window.MonacoEnvironment = {
  getWorker (_: string, label: string) {
    if (label === 'typescript' || label === 'javascript') return new TsWorker()
    if (label === 'json') return new JsonWorker()
    return new EditorWorker()
  }
}


export class MainScene extends Node {
	private motionByTouch = new MotionByTouch();

	private keymapperOfActions!: KeymapperOfActions;
	private normal_mode = new MappingsMode('normal');


	public TREE() { return {
		GridMap,
		World,
		TileMap,
		PopupContainer,

		textdata: TextNode,
		texthelp: TextNode,

		SystemInfo
	}}

	public static map: MapParser.Map;

	protected static async _load(scene: typeof this): Promise<void> {
		await Promise.all([
			super._load(scene),

			Popup.load(),
			WallCell.load(),
			ProgrammableCell.load()
		]);

		this.map = await MapParser.instance().loadMap('maps/test-map.json');
	}


	// aliases
	public get $gridMap() { return this.get('GridMap'); }

	public get $world() { return this.get('World'); }
	public get $tilemap() { return this.get('TileMap'); }
	public get $popups() { return this.get('PopupContainer'); }

	public get $textdata() { return this.get('textdata'); }
	public get $texthelp() { return this.get('texthelp'); }


	private editor!: monaco.editor.IStandaloneCodeEditor;
	private programs_executor = new ProgramsExecutor();

	protected async _init(this: MainScene): Promise<void> {
		await super._init();
		gm.viewport.position.set(200, 200);


		const $editor = document.createElement('div');
		canvas.append($editor);
		$editor.className = 'editor';

		await import('monaco-themes/themes/Nord.json').then(data => monaco.editor.defineTheme('Nord', data as any));

		monaco.languages.typescript.javascriptDefaults.addExtraLib(
			await fetch(`${location.origin}/user-code/${'global.d.ts'}`).then(data => data.text()), 'global.d.ts');

		monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
			...monaco.languages.typescript.javascriptDefaults.getCompilerOptions(),
			target: monaco.languages.typescript.ScriptTarget.ESNext,
			checkJs: true,
			allowJs: true,
			lib: ['ESNext'],
			nolib: true,
			strict: true,
			skipLibCheck: true,
			skipDefaultLibCheck: true,
		});

		this.editor = monaco.editor.create($editor, {
			language: 'javascript',
			theme: 'Nord',
			automaticLayout: true,
			value: await fetch(`${location.origin}/user-code/${'main.js'}`).then(data => data.text())
		});


		this.get('TileMap')!.map = MainScene.map;


		const hiddenInput = document.createElement('input');
		hiddenInput.style.position = 'fixed';
		hiddenInput.style.top = '-1000px';
		canvas.append(hiddenInput);

		const keyboardInputInterceptor = new KeyboardInputInterceptor(hiddenInput);
		keyboardInputInterceptor.init();
		// canvas.addEventListener('click', () => keyboardInputInterceptor.focus());

		this.$world.size.set(20, 20);
		this.$world.date.setHours(6);

		this.keymapperOfActions = new KeymapperOfActions(this.normal_mode);
		this.keymapperOfActions.init(keyboardInputInterceptor);
		this.keymapperOfActions.enable();


		const updateOnResize = (size: Vector2) => {
			this.$gridMap.size.set(size);
		};

		updateOnResize(gm.viewport.size);

		gm.on('resize', updateOnResize);
	}

	protected _ready(this: MainScene): void {
		this.$popups.zIndex += 100;

		this.$textdata.color = '#99ee22';
		this.$textdata.position.set(-200, 100);

		this.$texthelp.color = '#779933';
		this.$texthelp.position.set(400, 40);
		this.$texthelp.text =
`dblclick - полноэкранный режим`


		const tilemap = this.$tilemap.map!;
		// console.log(tilemap);


		const addProgrammableCellToWorld = (code: string, v: Vector2, dir: number, inited: boolean = false) => {
			const o = new ProgrammableCell();
			o.name += Math.random();
			o.isPickupable = false;

			this.programs_executor.add(o, code, inited);

			o.init().then(() => {
				o.cellpos.set(v);
				o.celldir = dir;

				o.on('api:budoff', o => {
					addProgrammableCellToWorld(this.editor.getValue(), o.cellpos || new Vector2(8, 8), o.celldir+4, true);
				});

				this.$world.addChild(o);
			});
		}


		const layer = tilemap.layers[0];
		if(layer.type === 'tilelayer') {
			for(let i = 0; i < layer.data.length; i++) {
				if(layer.data[i] === 0) continue;

				const x = i % layer.width;
				const y = Math.floor(i / layer.width);

				const o = new WallCell();
				o.name += i;
				o.isPickupable = false;

				o.init().then(() => {
					o.cellpos.set(x, y);
					this.$world.addChild(o);
				});
			}
		}


		this.programs_executor.t = 500;

		canvas.onclick = () => {
			if(!this.programs_executor.isStarted) {
				addProgrammableCellToWorld(
					this.editor.getValue(),
					this.programs_executor.arr[0]?.o.cellpos || new Vector2(8, 8),
					this.programs_executor.arr[0]?.o.celldir+4 || 2
				);
				this.programs_executor.start();
			}

			canvas.onclick = null;
		};
	}

	protected _process(this: MainScene, dt: number): void {
		this.motionByTouch.update(dt, touches, gm.viewport.position);

		this.keymapperOfActions.update(dt);

		// gm.viewport.position.moveTime(new Vector2(200, 200), 10);
		// gm.camera.process(dt, touches);

		this.$textdata.text = 'DATE: '+this.$world.date.getTimeString();
	}

	protected _draw(this: MainScene, { ctx, size }: Viewport): void {
		ctx.resetTransform();

		const center = Vector2.ZERO;

		let a = 30;

		ctx.beginPath();
		ctx.strokeStyle = '#ffff00';
		ctx.moveTo(center.x, center.y-a);
		ctx.lineTo(center.x, center.y+a);
		ctx.moveTo(center.x-a, center.y);
		ctx.lineTo(center.x+a, center.y);
		ctx.stroke();

		ctx.fillStyle = '#eeeeee';
		// ctx.font = '20px Arial';
		// ctx.fillText('timeout: ' + this.keymapperOfActions.timeout.toFixed(0), 10, 120);
		ctx.font = '15px Arial';
		ctx.fillText('date: '+this.$world.date.getTimeString(), 10, 140);


		ctx.fillStyle = '#eeeeee';
		ctx.font = '15px arkhip';
		ctx.fillText(this.keymapperOfActions.acc.join(''), 10, size.y-10);
	}
}
