import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { loadData } from '../data/dataLoader.js';
import { search, getSuggestions } from '../services/searchService.js';

describe('CampusGuide Search System', () => {
  before(async () => {
    await loadData();
  });

  describe('Equipment Search', () => {
    it('should find GPU Workstation when searching "gpu"', () => {
      const results = search('gpu', 'all', 10);
      const gpuResults = results.results.filter(r => 
        r.type === 'equipment' && r.name === 'GPU Workstation'
      );
      assert.ok(gpuResults.length > 0, 'Should find GPU Workstation');
      assert.strictEqual(gpuResults[0].location.name, 'AI & Machine Learning Lab');
      assert.strictEqual(gpuResults[0].category, 'Computing');
      assert.strictEqual(gpuResults[0].quantity, 10);
    });

    it('should find Oscilloscope when searching "oscillo"', () => {
      const results = search('oscillo', 'all', 10);
      const oscilloResults = results.results.filter(r => 
        r.type === 'equipment' && r.name === 'Oscilloscope'
      );
      assert.ok(oscilloResults.length > 0, 'Should find Oscilloscope');
      assert.strictEqual(oscilloResults[0].location.name, 'Electronics Lab');
    });

    it('should find BOTH 3D Printers when searching "3d printer"', () => {
      const results = search('3d printer', 'all', 10);
      const printerResults = results.results.filter(r => 
        r.type === 'equipment' && r.name === '3D Printer'
      );
      assert.strictEqual(printerResults.length, 2, 'Should find both 3D Printers');
      
      const locations = printerResults.map(r => r.location.name).sort();
      assert.deepStrictEqual(locations, [
        '3D Fabrication Studio',
        'Innovation & Prototyping Lab'
      ]);
    });

    it('should find BOTH Laser Cutters when searching "laser"', () => {
      const results = search('laser', 'all', 10);
      const laserResults = results.results.filter(r => 
        r.type === 'equipment' && r.name === 'Laser Cutter'
      );
      assert.strictEqual(laserResults.length, 2, 'Should find both Laser Cutters');
    });

    it('should find Camera when searching "camera"', () => {
      const results = search('camera', 'all', 10);
      const cameraResults = results.results.filter(r => 
        r.type === 'equipment' && r.name === 'Camera'
      );
      assert.ok(cameraResults.length > 0, 'Should find Camera');
      assert.strictEqual(cameraResults[0].location.name, 'Digital Media Studio');
    });

    it('should find Kali Linux and Wireshark when searching "cyber"', () => {
      const results = search('cyber', 'all', 10);
      const cyberEquipment = results.results.filter(r => 
        r.type === 'equipment' && 
        (r.name === 'Kali Linux Workstation' || r.name === 'Wireshark Workstation')
      );
      assert.ok(cyberEquipment.length >= 2, 'Should find Kali Linux and Wireshark Workstations');
    });

    it('should find resources with Python equipment when searching "python"', () => {
      const results = search('python', 'all', 10);
      const pythonResources = results.results.filter(r => 
        r.type === 'resource' && r.equipment && r.equipment.includes('Python')
      );
      assert.ok(pythonResources.length >= 4, 'Should find multiple resources with Python');
    });
  });

  describe('Resource Search', () => {
    it('should find Library resources when searching "library"', () => {
      const results = search('library', 'all', 10);
      const libraryResources = results.results.filter(r => 
        r.type === 'resource' && r.building === 'Library'
      );
      assert.ok(libraryResources.length >= 5, 'Should find Library resources');
    });

    it('should find Study Rooms when searching "study"', () => {
      const results = search('study', 'all', 10);
      const studyResources = results.results.filter(r => 
        r.type === 'resource' && 
        (r.resource_type === 'Study Room' || r.resource_type === 'Study Space')
      );
      assert.ok(studyResources.length >= 3, 'Should find Study Rooms/Spaces');
    });

    it('should find Seminar Rooms when searching "seminar"', () => {
      const results = search('seminar', 'all', 10);
      const seminarResources = results.results.filter(r => 
        r.type === 'resource' && r.name.includes('Seminar')
      );
      assert.ok(seminarResources.length >= 2, 'Should find Seminar Rooms');
    });

    it('should find Robotics Lab when searching "robot"', () => {
      const results = search('robot', 'all', 10);
      const robotResources = results.results.filter(r => 
        r.type === 'resource' && r.name.includes('Robotics')
      );
      assert.ok(robotResources.length > 0, 'Should find Robotics Lab');
    });
  });

  describe('Location Search', () => {
    it('should find Block A resources when searching "block a"', () => {
      const results = search('block a', 'locations', 10);
      assert.ok(results.results.length > 0, 'Should find Block A location');
      assert.strictEqual(results.results[0].building, 'Block A');
    });
  });

  describe('Edge Cases', () => {
    it('should return empty results for "lens" (non-existent equipment)', () => {
      const results = search('lens', 'all', 10);
      assert.strictEqual(results.count, 0, 'Should return 0 results for lens');
      assert.strictEqual(results.results.length, 0, 'Results array should be empty');
    });

    it('should handle empty query with error', () => {
      const results = search('', 'all', 10);
      assert.strictEqual(results.count, 0);
    });

    it('should handle whitespace-only query', () => {
      const results = search('   ', 'all', 10);
      assert.strictEqual(results.count, 0);
    });

    it('should be case-insensitive', () => {
      const lowerResults = search('gpu', 'all', 10);
      const upperResults = search('GPU', 'all', 10);
      const mixedResults = search('GpU', 'all', 10);
      
      assert.strictEqual(lowerResults.count, upperResults.count);
      assert.strictEqual(lowerResults.count, mixedResults.count);
    });

    it('should handle partial queries', () => {
      const results = search('rasp', 'all', 10);
      const raspberryResults = results.results.filter(r => 
        r.name.includes('Raspberry Pi')
      );
      assert.ok(raspberryResults.length > 0, 'Should find Raspberry Pi with partial query');
    });

    it('should respect limit parameter', () => {
      const results5 = search('lab', 'all', 5);
      const results10 = search('lab', 'all', 10);
      
      assert.ok(results5.results.length <= 5, 'Should respect limit of 5');
      assert.ok(results10.results.length <= 10, 'Should respect limit of 10');
    });
  });

  describe('Filters', () => {
    it('should filter by equipment type', () => {
      const results = search('lab', 'equipment', 10);
      const hasResources = results.results.some(r => r.type === 'resource');
      assert.ok(!hasResources, 'Should not return resources when filtering by equipment');
    });

    it('should filter by resources type', () => {
      const results = search('lab', 'resources', 10);
      const hasEquipment = results.results.some(r => r.type === 'equipment');
      assert.ok(!hasEquipment, 'Should not return equipment when filtering by resources');
    });

    it('should filter by locations type', () => {
      const results = search('block', 'locations', 10);
      results.results.forEach(r => {
        assert.strictEqual(r.type, 'location', 'Should only return location results');
      });
    });
  });

  describe('Suggestions', () => {
    it('should return suggestions for "gpu"', () => {
      const suggestions = getSuggestions('gpu', 8);
      assert.ok(suggestions.length > 0, 'Should return suggestions');
      assert.ok(suggestions.some(s => s.label === 'GPU Workstation'));
    });

    it('should limit suggestions', () => {
      const suggestions = getSuggestions('lab', 3);
      assert.ok(suggestions.length <= 3, 'Should respect suggestion limit');
    });

    it('should handle empty query for suggestions', () => {
      const suggestions = getSuggestions('', 8);
      assert.strictEqual(suggestions.length, 0, 'Should return empty for empty query');
    });
  });

  describe('Relevance Ranking', () => {
    it('should rank exact matches higher than partial matches', () => {
      const results = search('gpu', 'all', 10);
      const gpuWorkstation = results.results.find(r => r.name === 'GPU Workstation');
      const otherResults = results.results.filter(r => r.name !== 'GPU Workstation');
      
      if (gpuWorkstation && otherResults.length > 0) {
        assert.ok(
          gpuWorkstation.score >= otherResults[0].score,
          'Exact match should have higher or equal score'
        );
      }
    });

    it('should rank duplicate equipment correctly (3D Printer)', () => {
      const results = search('3d printer', 'all', 10);
      const printers = results.results.filter(r => r.name === '3D Printer');
      
      assert.strictEqual(printers.length, 2, 'Should find both printers');
      assert.ok(
        printers[0].score > 0 && printers[1].score > 0,
        'Both printers should have positive scores'
      );
    });
  });
});
