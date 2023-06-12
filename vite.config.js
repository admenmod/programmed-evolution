import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';


const prefix = `monaco-editor/esm/vs`;
export default defineConfig({
	plugins: [tsconfigPaths()],
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					jsonWorker: [`${prefix}/language/json/json.worker`],
					cssWorker: [`${prefix}/language/css/css.worker`],
					htmlWorker: [`${prefix}/language/html/html.worker`],
					tsWorker: [`${prefix}/language/typescript/ts.worker`],
					editorWorker: [`${prefix}/editor/editor.worker`]
				}
			}
		}
	}
});
