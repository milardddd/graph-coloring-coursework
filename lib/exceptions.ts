export class GraphAlgorithmException extends Error {
    constructor(message: string) {
        super(message);
        this.name = "GraphAlgorithmException";
    }
}

export class AlgorithmTimeoutException extends GraphAlgorithmException {
    public readonly limitMs: number;

    constructor(message: string, limitMs: number) {
        super(message);
        this.name = "AlgorithmTimeoutException";
        this.limitMs = limitMs;
    }
}