const mongoose = require('mongoose');

const models = {};

// Helper to get or create a Mongoose model dynamically based on collection name
const getModel = (collectionName) => {
  if (models[collectionName]) {
    return models[collectionName];
  }

  // Create a flexible schema that allows any fields (strict: false)
  const schema = new mongoose.Schema(
    {
      id: { type: mongoose.Schema.Types.Mixed, required: true, unique: true },
    },
    { strict: false, collection: collectionName } // Use strict: false to accept dynamic fields
  );

  // Mongoose auto-pluralizes, but passing it explicitly to the collection param prevents issues.
  const model = mongoose.model(collectionName, schema);
  models[collectionName] = model;

  return model;
};

module.exports = { getModel };
