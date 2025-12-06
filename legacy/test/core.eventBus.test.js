import { EventBus } from '../core/eventBus.js';
const bus = new EventBus();
let called = false;
bus.on('test', () => called = true);
bus.emit('test');
if (!called) throw new Error('EventBus failed');
console.log('EventBus Test OK');