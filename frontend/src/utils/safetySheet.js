// Builds a plain-text, printable safety sheet for a tool (the "downloadable documentation").
export function buildSafetySheet(tool) {
  const lines = [
    `CIVICSHARE SAFETY SHEET`,
    `=======================`,
    `Tool: ${tool.name}`,
    `Category: ${tool.category}   Condition: ${tool.condition}   Safety rating: ${tool.safetyRating}/5`,
    `Pickup station: ${tool.pickupStation}`,
    '',
    'REQUIRED SAFETY GEAR',
    ...(tool.safetyGear.length ? tool.safetyGear.map((g) => `  [ ] ${g}`) : ['  (none required)']),
    '',
    'OPERATING GUIDELINES',
    ...(tool.safetyGuidelines.length ? tool.safetyGuidelines.map((g, i) => `  ${i + 1}. ${g}`) : ['  (none listed)']),
    '',
    'Read the manufacturer manual before first use. Report damage immediately.',
  ];
  return lines.join('\n');
}

export function safetySheetFilename(tool) {
  return `${tool.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-safety-sheet.txt`;
}
