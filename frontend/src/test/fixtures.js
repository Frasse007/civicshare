export const makeTool = (over = {}) => ({
  id: 1, name: 'Test Ladder', description: 'A sturdy ladder for tests.', category: 'Ladders', condition: 'Good',
  safetyRating: 4, status: 'available', emoji: '🪜', pickupStation: 'Maple Street Garage', latitude: 41.88, longitude: -87.62,
  safetyGuidelines: ['Keep three points of contact.', 'Never stand on the top rung.'], safetyGear: ['Gloves', 'Boots'], weatherSensitive: false,
  ...over,
});

export const makeListResponse = (tools = [makeTool()], meta = {}) => ({
  data: tools,
  meta: { total: tools.length, page: 1, pageSize: 12, totalPages: 1, ...meta },
  filters: { categories: ['Ladders', 'Cleaning'], conditions: ['Good', 'Fair'], statuses: ['available', 'borrowed', 'maintenance'] },
});

export const member = { id: 2, name: 'Maya Member', email: 'maya@example.com', role: 'member' };
export const admin = { id: 1, name: 'Ada Admin', email: 'ada@example.com', role: 'admin' };
