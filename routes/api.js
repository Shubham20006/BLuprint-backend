const express = require('express');
const { getModel } = require('../models/GenericModel');
const router = express.Router();

// GET all items or filter by query params
router.get('/:resource', async (req, res) => {
  console.log(`GET /api/${req.params.resource}`, req.query);
  try {
    const { resource } = req.params;
    const Model = getModel(resource);
    const query = { ...req.query };

    // Find documents based on query filters
    const items = await Model.find(query);
    
    // Transform to frontend format (removes _id, __v, returning pure JSON object)
    const formattedItems = items.map(item => {
      const obj = item.toObject();
      delete obj._id;
      delete obj.__v;
      return obj;
    });

    res.json(formattedItems);
  } catch (error) {
    console.error(`Error fetching ${req.params.resource}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// GET single item by custom id
router.get('/:resource/:id', async (req, res) => {
  console.log(`GET /api/${req.params.resource}/${req.params.id}`);
  try {
    const { resource, id } = req.params;
    const Model = getModel(resource);

    const item = await Model.findOne({ id });

    if (!item) {
      return res.status(404).json({ message: `Item ${id} not found in ${resource}` });
    }

    const obj = item.toObject();
    delete obj._id;
    delete obj.__v;

    res.json(obj);
  } catch (error) {
    console.error(`Error fetching ${req.params.resource} item:`, error);
    res.status(500).json({ error: error.message });
  }
});

// POST new item
router.post('/:resource', async (req, res) => {
  console.log(`POST /api/${req.params.resource}`, req.body);
  try {
    const { resource } = req.params;
    const Model = getModel(resource);

    // Generate custom id if not provided, just like mock server
    const payload = { ...req.body };
    if (!payload.id) {
      payload.id = Math.random().toString(36).substring(2, 10);
    }
    if (!payload.createdAt) {
      payload.createdAt = new Date().toISOString();
    }

    const newItem = new Model(payload);
    await newItem.save();

    const obj = newItem.toObject();
    delete obj._id;
    delete obj.__v;

    res.status(201).json(obj);
  } catch (error) {
    console.error(`Error creating ${req.params.resource}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH / PUT update item
const updateItem = async (req, res) => {
  console.log(`${req.method} /api/${req.params.resource}/${req.params.id}`, req.body);
  try {
    const { resource, id } = req.params;
    const Model = getModel(resource);

    const payload = { ...req.body, updatedAt: new Date().toISOString() };

    // Update the document where custom `id` matches
    const updatedItem = await Model.findOneAndUpdate(
      { id },
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: `Item ${id} not found` });
    }

    const obj = updatedItem.toObject();
    delete obj._id;
    delete obj.__v;

    res.json(obj);
  } catch (error) {
    console.error(`Error updating ${req.params.resource}:`, error);
    res.status(500).json({ error: error.message });
  }
};

router.patch('/:resource/:id', updateItem);
router.put('/:resource/:id', updateItem);

// DELETE item
router.delete('/:resource/:id', async (req, res) => {
  console.log(`DELETE /api/${req.params.resource}/${req.params.id}`);
  try {
    const { resource, id } = req.params;
    const Model = getModel(resource);

    const deletedItem = await Model.findOneAndDelete({ id });

    if (!deletedItem) {
      return res.status(404).json({ message: `Resource ${resource} not found or item ${id} missing` });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(`Error deleting ${req.params.resource}:`, error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
