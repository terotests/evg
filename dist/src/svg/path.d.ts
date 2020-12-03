export declare class Vec2 {
    x: number;
    y: number;
    static CreateNew(i: number, j: number): Vec2;
}
export interface IPathExecutor {
    ClosePath(): void;
    Move(x: number, y: number): void;
    Line(x: number, y: number): void;
    Curve(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): void;
}
export declare class Mat2 {
    m0: number;
    m1: number;
    m2: number;
    m3: number;
    m4: number;
    m5: number;
    toIdentity(): void;
    setTranslate(tx: number, ty: number): void;
    setScale(sx: number, sy: number): void;
    setSkewX(v: number): void;
    setSkewY(v: number): void;
    setRotation(v: number): void;
    multiply(b: Mat2): void;
    inverse(): Mat2;
    transformPoint(v: Vec2): Vec2;
    rotateVector(v: Vec2): Vec2;
}
export declare class PathExecutor {
    constructor();
    ClosePath(): void;
    Move(x: number, y: number): void;
    Line(x: number, y: number): void;
    Curve(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): void;
}
declare type PathItem = string | number;
export declare class PathScaler extends PathExecutor {
    pathParts: Array<PathItem[]>;
    constructor();
    Move(x: number, y: number): void;
    Line(x: number, y: number): void;
    Curve(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): void;
    getString(width: number, height: number): string;
}
export declare class PathCollector extends PathExecutor {
    pathParts: Array<PathItem>;
    constructor();
    Move(x: number, y: number): void;
    Line(x: number, y: number): void;
    Curve(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): void;
    getString(): string;
}
export declare class PathSegment {
    t0: number;
    t1: number;
    t2: number;
    t3: number;
    t4: number;
    t5: number;
    t6: number;
}
export declare class EVGPathParser {
    i: number;
    __len: number;
    last_number: number;
    buff: string;
    __sqr(v: number): number;
    __xformPoint(point: Vec2, seg: PathSegment): Vec2;
    __xformVec(point: Vec2, seg: PathSegment): Vec2;
    __vmag(point: Vec2): number;
    __vecrat(u: Vec2, v: Vec2): number;
    __vecang(u: Vec2, v: Vec2): number;
    scanNumber(): boolean;
    pathArcTo(callback: IPathExecutor, cp: Vec2, args: PathSegment, rel: boolean): Vec2;
    parsePath(path: string, callback: IPathExecutor): void;
}
export {};
