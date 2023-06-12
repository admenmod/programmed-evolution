declare function idle(n: number = 1): Generator<string, void, never>;

declare let energy: number;

declare let isBudoff: boolean;

declare function moveForward(n: number = 1): Generator<string, void, never>;

declare function turnLeft(n: number = 1): Generator<string, void, never>;
declare function turnRight(n: number = 1): Generator<string, void, never>;


declare const around: [string, string, string, string, string, string, string, string] & { forward: string };
declare function lookAround(): Generator<string, void, never>;

declare function budoff(): Generator<string, void, never>;
