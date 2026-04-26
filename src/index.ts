import { AccessBridgeWorker } from '@/workers';
import { AbstractWorker } from '@/base';

const worker: AbstractWorker = new AccessBridgeWorker();

export { CronTasksWorker } from '@/workers';
export default worker;
