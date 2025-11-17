import { AccessBridgeWorker } from '@/workers';
import { AbstractWorker } from '@/base';

const worker: AbstractWorker = new AccessBridgeWorker();

export default worker;
