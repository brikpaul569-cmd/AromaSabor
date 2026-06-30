/**
 * Expire stale proposals script
 *
 * Marks all proposals in 'enviado' status that are past their expiresAt
 * as 'expirado'. Safe to run multiple times (idempotent).
 *
 * Usage:
 *   node scripts\expire-stale-proposals.cjs
 *
 * The script reads MONGO_URI from the environment. Set it before running:
 *   $env:MONGO_URI="mongodb://user:pass@host:port/db?..."; node scripts\expire-stale-proposals.cjs
 *
 * Or edit the fallback URI below if running locally.
 */

const uri = process.env.MONGO_URI || 'mongodb://aromaSabor:YqFzNW9G7UUfxZJm@ac-s1incmw-shard-00-00.s9e1zvd.mongodb.net:27017,ac-s1incmw-shard-00-01.s9e1zvd.mongodb.net:27017,ac-s1incmw-shard-00-02.s9e1zvd.mongodb.net:27017/aromasabor?retryWrites=true&w=majority&ssl=true&authSource=admin&appName=Cluster0';

async function main() {
  const mongoose = require('mongoose');

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const proposals = db.collection('proposals');

    // Find proposals in 'enviado' status that are past their expiration
    const cursor = proposals.find({
      status: 'enviado',
      expiresAt: { $lt: new Date() },
    });

    const toExpire = await cursor.toArray();
    console.log(`Found ${toExpire.length} stale proposal(s) to expire:\n`);

    if (toExpire.length === 0) {
      console.log('Nothing to expire. All clean!');
      await mongoose.disconnect();
      return;
    }

    for (const p of toExpire) {
      console.log(`  • ${p.clientName || '(no name)'} | created: ${p.createdAt?.toLocaleString()} | expires: ${p.expiresAt?.toLocaleString()} | token: ${p.token?.substring(0, 8)}`);
    }

    // Mark them as expired
    const result = await proposals.updateMany(
      {
        status: 'enviado',
        expiresAt: { $lt: new Date() },
      },
      {
        $set: { status: 'expirado' },
      },
    );

    console.log(`\n✓ ${result.modifiedCount} proposal(s) marked as 'expirado'`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
