import type { VXRNOptions } from '../types';
/**
 * The main entry point for dev mode
 *
 * Note that much of the logic is being run by plugins:
 *
 *  - createFileSystemRouter does most of the fs-routes/request handling
 *  - clientTreeShakePlugin handles loaders/transforms
 *
 */
export type DevOptions = VXRNOptions & {
    clean?: boolean;
};
export declare const dev: (optionsIn: DevOptions) => Promise<{
    server: import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
    viteServer: import("vite").ViteDevServer;
    start(): Promise<{
        closePromise: Promise<unknown>;
    }>;
    stop: () => Promise<void>;
}>;
//# sourceMappingURL=dev.d.ts.map