const express = require('express');
const router = express.Router();
const { 
  queryRAGAssistant, 
  getAIAnalytics, 
  getKnowledgeDocs, 
  addKnowledgeDoc, 
  deleteKnowledgeDoc 
} = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/query', queryRAGAssistant);
router.get('/analytics', protect, getAIAnalytics);

router.get('/documents', protect, getKnowledgeDocs);
router.post('/documents', protect, authorize('admin'), addKnowledgeDoc);
router.delete('/documents/:id', protect, authorize('admin'), deleteKnowledgeDoc);

module.exports = router;
