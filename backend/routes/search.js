import { Router } from 'express';
import { search, getSuggestions } from '../services/searchService.js';

const router = Router();

const VALID_TYPES = ['all', 'equipment', 'resources', 'locations'];

router.get('/search', (req, res) => {
  try {
    const { q, type = 'all', limit = '10' } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ error: 'Search query is required.' });
    }
    
    const searchType = type.toLowerCase();
    if (!VALID_TYPES.includes(searchType)) {
      return res.status(400).json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
    }
    
    const searchLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    
    const results = search(q, searchType, searchLimit);
    
    if (results.results.length === 0) {
      return res.json({
        ...results,
        message: 'No matching campus resources or equipment found.'
      });
    }
    
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Unable to complete search.' });
  }
});

router.get('/search/suggestions', (req, res) => {
  try {
    const { q, limit = '8' } = req.query;
    
    if (!q || q.trim() === '') {
      return res.json({ query: q, suggestions: [] });
    }
    
    const suggestionLimit = Math.min(Math.max(parseInt(limit, 10) || 8, 1), 20);
    
    const suggestions = getSuggestions(q, suggestionLimit);
    
    res.json({
      query: q,
      suggestions
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Unable to fetch suggestions.' });
  }
});

export default router;
