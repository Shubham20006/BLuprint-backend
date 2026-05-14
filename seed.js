require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { getModel } = require('./models/GenericModel');

// Path to the frontend's db.json
const DB_JSON_PATH = path.join(__dirname, '../BLuprintAI/src/data/db.json');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    if (!fs.existsSync(DB_JSON_PATH)) {
      console.error('db.json not found at:', DB_JSON_PATH);
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf-8'));
    
    for (const [collectionName, items] of Object.entries(data)) {
      console.log(`Seeding collection: ${collectionName}`);
      const Model = getModel(collectionName);
      
      // Clear existing data
      await Model.deleteMany({});
      
      // If collection is users, add hashed password
      let processedItems = items;
      if (collectionName === 'users') {
        const hashedPassword = await bcrypt.hash('password123', 10);
        processedItems = items.map(user => ({
          ...user,
          password: hashedPassword
        }));
      }

      // Insert new data
      if (processedItems.length > 0) {
        await Model.insertMany(processedItems);
      }
      console.log(`Seeded ${processedItems.length} items to ${collectionName}`);
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seed();
