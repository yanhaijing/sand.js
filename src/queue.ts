type OperationType = (done: any) => void;

export class Transaction {
    private done: () => void;
    private completeCount = 0;
    operations: OperationType[] = [];

    constructor(done: () => void) {
        this.done = done;
    }
    add(operation: OperationType) {
        this.operations.push(operation);
    }
    // 通知Transaction完成了一个事务
    // 当所有事务都完成，执行done
    complete() {
        if (this.operations.length === 0) {
            this.done();
            return;
        }

        const completeCount = this.completeCount + 1;

        if (completeCount === this.operations.length) {
            this.done();
        }

        this.completeCount = completeCount;
    }
}

type TaskType = OperationType;

interface TaskQueueItem {
    task: TaskType;
    complete: () => void;
}

class TaskQueue {
    private queue: TaskQueueItem[] = [];
    private timeslice = 100;
    private running = false;
    private timeoutId?: number;
    constructor() {}
    private run() {
        // 如果当前正在执行中
        if (this.running) {
            return;
        }

        this.running = true;
        clearTimeout(this.timeoutId);

        const { queue, timeslice } = this;

        const stime = Date.now();
        // 队列有内容 且时间片未用完
        while (queue.length && Date.now() - stime < timeslice) {
            const item = queue.shift();

            item!.task(() => {
                item!.complete();
            });
        }

        this.running = false;
        console.log('TaskQueue cur timeslice done');
        // 本次时间片结束，判断是否还有下次时间片
        if (queue.length) {
            console.log('TaskQueue next timeslice');
            this.timeoutId = setTimeout(() => this.run());
        }
    }
    add(transaction: Transaction) {
        if (transaction.operations.length === 0) {
            transaction.complete();
            return;
        }
        transaction.operations.forEach((item) => {
            this.queue.push({
                task: item,
                complete: () => {
                    transaction.complete();
                },
            });
        });

        this.run();
    }
}

export const globalTaskQueue = new TaskQueue();
