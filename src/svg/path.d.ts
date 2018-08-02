export declare class Vec2 {
    x: number;
    y: number;
    static CreateNew(i: any, j: any): Vec2;
}
export declare class Mat2 {
    m0: number;
    m1: number;
    m2: number;
    m3: number;
    m4: number;
    m5: number;
    toIdentity(): void;
    setTranslate(tx: any, ty: any): void;
    setScale(sx: any, sy: any): void;
    setSkewX(v: any): void;
    setSkewY(v: any): void;
    setRotation(v: any): void;
    multiply(b: any): void;
    inverse(): Mat2;
    transformPoint(v: any): Vec2;
    rotateVector(v: any): Vec2;
}
export declare class PathExecutor {
    constructor();
    ClosePath(): void;
    Move(x: any, y: any): void;
    Line(x: any, y: any): void;
    Curve(x0: any, y0: any, x1: any, y1: any, x2: any, y2: any): void;
}
export declare class PathScaler extends PathExecutor {
    pathParts: any[];
    constructor();
    Move(x: any, y: any): void;
    Line(x: any, y: any): void;
    Curve(x0: any, y0: any, x1: any, y1: any, x2: any, y2: any): void;
    getString(width: number, height: number): string;
}
export declare class PathCollector extends PathExecutor {
    pathParts: any[];
    constructor();
    Move(x: any, y: any): void;
    Line(x: any, y: any): void;
    Curve(x0: any, y0: any, x1: any, y1: any, x2: any, y2: any): void;
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
export declare class EVGBezierPath {
    points: any[];
    pointCnt: number;
    closed: boolean;
    bounds: Vec2;
    cp1: Vec2;
    cp2: Vec2;
    controlPoint: Vec2;
    close(): void;
    Line(point: any): void;
    moveTo(point: any): void;
}
export declare class EVGPathParser {
    i: number;
    __len: number;
    last_number: number;
    buff: string;
    __sqr(v: any): number;
    __xformPoint(point: any, seg: any): Vec2;
    __xformVec(point: any, seg: any): Vec2;
    __vmag(point: any): number;
    __vecrat(u: any, v: any): number;
    __vecang(u: any, v: any): number;
    scanNumber(): boolean;
    pathArcTo(callback: any, cp: any, args: any, rel: any): Vec2;
    parsePath(path: any, callback: any): void;
}
