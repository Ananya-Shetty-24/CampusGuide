import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { loadData } from '../data/dataLoader.js';
import { search } from '../services/searchService.js';
import {
  getResourceStatus,
  setLiveStatus,
  VALID_STATUSES
} from '../services/liveStatus.js';
import {
  getResources,
  getResourceById,
  getEquipmentByResourceId
} from '../data/dataLoader.js';

describe('Resource API + Live Status System', () => {
  before(async () => {
    await loadData();
  });

  describe('Resource Data Access', () => {
    it('should retrieve R001 - AI & Machine Learning Lab', () => {
      const r = getResourceById('R001');
      assert.ok(r, 'R001 should exist');
      assert.strictEqual(r.resource_name, 'AI & Machine Learning Lab');
      assert.strictEqual(r.resource_type, 'Laboratory');
      assert.strictEqual(r.building, 'Block A');
      assert.strictEqual(r.floor, 2);
      assert.strictEqual(r.capacity, 60);
    });

    it('should retrieve R004 - Electronics Lab', () => {
      const r = getResourceById('R004');
      assert.ok(r, 'R004 should exist');
      assert.strictEqual(r.resource_name, 'Electronics Lab');
      assert.strictEqual(r.building, 'Block C');
    });

    it('should retrieve R008 - Innovation & Prototyping Lab', () => {
      const r = getResourceById('R008');
      assert.ok(r, 'R008 should exist');
      assert.strictEqual(r.resource_name, 'Innovation & Prototyping Lab');
    });

    it('should retrieve R021 - 3D Fabrication Studio', () => {
      const r = getResourceById('R021');
      assert.ok(r, 'R021 should exist');
      assert.strictEqual(r.resource_name, '3D Fabrication Studio');
    });

    it('should return null for non-existent resource R999', () => {
      const r = getResourceById('R999');
      assert.strictEqual(r, undefined);
    });
  });

  describe('Equipment Join', () => {
    it('should find equipment for R001 including GPU Workstation', () => {
      const eq = getEquipmentByResourceId('R001');
      assert.ok(eq.length > 0, 'R001 should have equipment');
      const gpu = eq.find(e => e.equipment_name === 'GPU Workstation');
      assert.ok(gpu, 'R001 should have GPU Workstation');
      assert.strictEqual(gpu.quantity, 10);
      assert.strictEqual(gpu.category, 'Computing');
    });

    it('should find Oscilloscope in R004 equipment', () => {
      const eq = getEquipmentByResourceId('R004');
      const osc = eq.find(e => e.equipment_name === 'Oscilloscope');
      assert.ok(osc, 'R004 should have Oscilloscope');
      assert.strictEqual(osc.quantity, 8);
    });

    it('should find 3D Printer in R008 equipment', () => {
      const eq = getEquipmentByResourceId('R008');
      const printer = eq.find(e => e.equipment_name === '3D Printer');
      assert.ok(printer, 'R008 should have 3D Printer');
      assert.strictEqual(printer.quantity, 3);
    });

    it('should find 3D Printer in R021 equipment', () => {
      const eq = getEquipmentByResourceId('R021');
      const printer = eq.find(e => e.equipment_name === '3D Printer');
      assert.ok(printer, 'R021 should have 3D Printer');
      assert.strictEqual(printer.quantity, 4);
    });

    it('should keep R008 and R021 as separate resources with separate equipment', () => {
      const eq008 = getEquipmentByResourceId('R008');
      const eq021 = getEquipmentByResourceId('R021');
      const r008 = getResourceById('R008');
      const r021 = getResourceById('R021');

      assert.notStrictEqual(r008.resource_name, r021.resource_name);
      assert.notStrictEqual(eq008.length, eq021.length);
    });
  });

  describe('Resource Collection', () => {
    it('should return all resources', () => {
      const all = getResources();
      assert.strictEqual(all.length, 25);
    });

    it('should filter by type Laboratory', () => {
      const labs = getResources().filter(r => r.resource_type === 'Laboratory');
      assert.ok(labs.length >= 10, 'Should have at least 10 laboratories');
      labs.forEach(r => {
        assert.strictEqual(r.resource_type, 'Laboratory');
      });
    });

    it('should filter by building Block C', () => {
      const blockC = getResources().filter(r => r.building === 'Block C');
      assert.ok(blockC.length >= 3, 'Block C should have at least 3 resources');
      blockC.forEach(r => {
        assert.strictEqual(r.building, 'Block C');
      });
    });
  });

  describe('Live Status', () => {
    it('should return default status for R001', () => {
      const status = getResourceStatus('R001');
      assert.ok(status, 'R001 should have a status');
      assert.strictEqual(status.resource_id, 'R001');
      assert.strictEqual(status.live_status, 'AVAILABLE');
      assert.ok(VALID_STATUSES.includes(status.current_status));
    });

    it('should set R001 to IN_USE', () => {
      const result = setLiveStatus('R001', 'IN_USE');
      assert.ok(result.success);
      assert.strictEqual(result.status, 'IN_USE');
    });

    it('should reflect IN_USE in status after setting', () => {
      const status = getResourceStatus('R001');
      assert.strictEqual(status.live_status, 'IN_USE');
      assert.strictEqual(status.current_status, 'IN_USE');
    });

    it('should set R001 back to AVAILABLE', () => {
      const result = setLiveStatus('R001', 'AVAILABLE');
      assert.ok(result.success);
      assert.strictEqual(result.status, 'AVAILABLE');
    });

    it('should reflect AVAILABLE after releasing', () => {
      const status = getResourceStatus('R001');
      assert.strictEqual(status.live_status, 'AVAILABLE');
      assert.strictEqual(status.current_status, 'AVAILABLE');
    });

    it('should reject invalid status', () => {
      const result = setLiveStatus('R001', 'BOGUS');
      assert.ok(result.error);
    });

    it('should reject status for non-existent resource', () => {
      const result = setLiveStatus('R999', 'IN_USE');
      assert.strictEqual(result.error, 'not_found');
    });

    it('should return null status for non-existent resource', () => {
      const status = getResourceStatus('R999');
      assert.strictEqual(status, null);
    });

    it('should set MAINTENANCE and reflect in current_status', () => {
      setLiveStatus('R004', 'MAINTENANCE');
      const status = getResourceStatus('R004');
      assert.strictEqual(status.live_status, 'MAINTENANCE');
      assert.strictEqual(status.current_status, 'MAINTENANCE');
      setLiveStatus('R004', 'AVAILABLE');
    });

    it('should set RESERVED and reflect in current_status', () => {
      setLiveStatus('R004', 'RESERVED');
      const status = getResourceStatus('R004');
      assert.strictEqual(status.live_status, 'RESERVED');
      assert.strictEqual(status.current_status, 'RESERVED');
      setLiveStatus('R004', 'AVAILABLE');
    });
  });

  describe('CSV Integrity', () => {
    it('should not corrupt campus_resources.csv', () => {
      const all = getResources();
      assert.strictEqual(all.length, 25);
      const r001 = getResourceById('R001');
      assert.strictEqual(r001.resource_name, 'AI & Machine Learning Lab');
      assert.strictEqual(r001.equipment.length, 4);
    });

    it('should not corrupt equipment.csv', () => {
      const allEq = [];
      for (const r of getResources()) {
        allEq.push(...getEquipmentByResourceId(r.resource_id));
      }
      assert.ok(allEq.length >= 32, 'Should have at least 32 equipment records');
    });
  });

  describe('Search API Regression', () => {
    it('should still find GPU Workstation', () => {
      const results = search('gpu', 'all', 10);
      const gpu = results.results.find(r => r.type === 'equipment' && r.name === 'GPU Workstation');
      assert.ok(gpu, 'Search for GPU should still work');
      assert.strictEqual(gpu.location.name, 'AI & Machine Learning Lab');
    });

    it('should still find both 3D Printers', () => {
      const results = search('3d printer', 'all', 10);
      const printers = results.results.filter(r => r.type === 'equipment' && r.name === '3D Printer');
      assert.strictEqual(printers.length, 2, 'Should find both 3D Printers');
    });

    it('should still return empty for lens', () => {
      const results = search('lens', 'all', 10);
      assert.strictEqual(results.count, 0);
    });
  });
});
