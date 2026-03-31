// ===========================
// Kafka Consumer Manager
// ===========================

import { Kafka, logLevel } from 'kafkajs';
import { EventEmitter } from 'events';

const KAFKA_BROKERS = (process.env.KAFKA_BOOTSTRAP_SERVERS || 'localhost:9092').split(',');

export class KafkaConsumerManager extends EventEmitter {
  constructor() {
    super();
    this.kafka = new Kafka({
      clientId: 'backend-api',
      brokers: KAFKA_BROKERS,
      logLevel: logLevel.WARN,
      retry: { initialRetryTime: 3000, retries: 20 }
    });
    this.consumers = [];
  }

  async connect() {
    console.log('📡 Connecting to Kafka consumers...');

    // Consumer for game events
    const gameConsumer = this.kafka.consumer({ groupId: 'backend-game-events' });
    await gameConsumer.connect();
    await gameConsumer.subscribe({ topic: 'game-events', fromBeginning: false });
    await gameConsumer.run({
      eachMessage: async ({ message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          this.emit('game-event', event);
        } catch (e) { /* skip malformed */ }
      }
    });
    this.consumers.push(gameConsumer);
    console.log('✅ Subscribed to game-events');

    // Consumer for commentary (from Flink)
    const commentaryConsumer = this.kafka.consumer({ groupId: 'backend-commentary' });
    await commentaryConsumer.connect();
    await commentaryConsumer.subscribe({ topic: 'commentary', fromBeginning: false });
    await commentaryConsumer.run({
      eachMessage: async ({ message }) => {
        try {
          const commentary = JSON.parse(message.value.toString());
          this.emit('commentary', commentary);
        } catch (e) { /* skip malformed */ }
      }
    });
    this.consumers.push(commentaryConsumer);
    console.log('✅ Subscribed to commentary');
  }

  async disconnect() {
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
  }
}
