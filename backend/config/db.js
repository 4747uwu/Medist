import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const getMaskedUri = (uri = '') => {
  try {
    if (!uri) return 'N/A';
    // hide credentials for logs
    return uri.replace(/\/\/(.*@)/, '//*****@');
  } catch {
    return 'masked-uri';
  }
};

const connectDB = async () => {
  try {
    console.log('🔗 Initializing MongoDB connection...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Anish';
    const masked = getMaskedUri(MONGODB_URI);
    console.log(`🌐 Using MONGODB_URI: ${masked}`);

    const conn = await mongoose.connect(MONGODB_URI, {
      // Connection behavior tuned for small/medium DigitalOcean droplets
      maxPoolSize: parseInt(process.env.MONGO_MAX_POOL, 50) || 8,
      minPoolSize: parseInt(process.env.MONGO_MIN_POOL, 10) || 2,
      maxIdleTimeMS: parseInt(process.env.MONGO_MAX_IDLE_MS, 10) || 30000,
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10) || 5000,
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS, 10) || 20000,
      connectTimeoutMS: parseInt(process.env.MONGO_CONNECT_TIMEOUT_MS, 10) || 5000,

      // Replica set / durability
      readPreference: process.env.MONGO_READ_PREFERENCE || 'primary',
      readConcern: { level: process.env.MONGO_READ_CONCERN || 'majority' },
      writeConcern: {
        w: process.env.MONGO_WRITE_W || 'majority',
        j: process.env.MONGO_WRITE_J === 'false' ? false : true
      },

      retryWrites: process.env.MONGO_RETRY_WRITES !== 'false',
      retryReads: process.env.MONGO_RETRY_READS !== 'false',

      // Compression (optional)
      compressors: process.env.MONGO_COMPRESSORS ? process.env.MONGO_COMPRESSORS.split(',') : ['zlib'],

      // core options
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Mongoose global settings
    // mongoose.set('debug', process.env.NODE_ENV !== 'production');
    mongoose.set('strictQuery', false);
    // mongoose.set('autoIndex', process.env.NODE_ENV !== 'production');

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔁 MongoDB reconnected');
    });

    // Validate transactions only if replica set appears configured
    if ((process.env.MONGODB_URI || '').includes('replicaSet') || process.env.MONGO_REPLICA_SET) {
      mongoose.connection.once('open', async () => {
        try {
          const session = await mongoose.startSession();
          await session.withTransaction(async () => {
            // no-op transaction to validate capability
          });
          session.endSession();
          console.log('✅ Transaction support confirmed');
        } catch (txErr) {
          console.warn('⚠️ Transaction test failed:', txErr.message);
        }
      });
    }

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n📴 Received ${signal}. Closing MongoDB connection...`);
      try {
        await mongoose.connection.close(false);
        console.log('✅ MongoDB connection closed gracefully');
        process.exit(0);
      } catch (closeErr) {
        console.error('❌ Error during shutdown:', closeErr);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    if (error.name === 'MongoServerSelectionError') {
      console.log('💡 Troubleshooting tips:');
      console.log('   1. Check MongoDB service: sudo systemctl status mongod');
      console.log('   2. Verify replica set: mongosh --eval "rs.status()"');
      console.log('   3. Test local connection: mongosh "mongodb://localhost:27017"');
      console.log('   4. Validate credentials and network/firewall rules');
    }
    process.exit(1);
  }
};

// Lightweight health check for readiness endpoints
export const checkDBHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'DISCONNECTED',
      1: 'CONNECTED',
      2: 'CONNECTING',
      3: 'DISCONNECTING'
    };

    if (state === 1) {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      const pingTime = Date.now() - start;
      return {
        healthy: true,
        pingTime,
        state: states[state],
        database: mongoose.connection.name,
        host: mongoose.connection.host
      };
    }

    return { healthy: false, state: states[state] };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
};

export default connectDB;