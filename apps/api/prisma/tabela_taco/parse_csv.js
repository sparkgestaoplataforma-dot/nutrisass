const fs = require('fs');
const data = fs.readFileSync('alimentos.csv', 'utf8');
const lines = data.split('\n');
const results = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const parts = [];
  let current = '';
  let inQuotes = false;
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '"') {
      inQuotes = !inQuotes;
    } else if (line[j] === ',' && !inQuotes) {
      parts.push(current);
      current = '';
    } else {
      current += line[j];
    }
  }
  parts.push(current);
  const parseFloatSafe = (val) => {
    if (!val || val === 'NA' || val === '1e-05' || val === 'Tr' || val === '') return 0;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };
  const grupo = parts[1] ? parts[1].trim() : '';
  const nome = parts[2] ? parts[2].trim() : '';
  const calorias = parseFloatSafe(parts[4]);
  const proteinas = parseFloatSafe(parts[6]);
  const gorduras = parseFloatSafe(parts[7]);
  const carboidratos = parseFloatSafe(parts[9]);
  const fibra = parseFloatSafe(parts[10]);
  if (nome) {
    results.push({
      nome,
      grupo,
      calorias,
      proteinas,
      carboidratos,
      gorduras,
      fibra
    });
  }
}
fs.writeFileSync('alimentos.json', JSON.stringify(results, null, 2));
console.log('JSON created with ' + results.length + ' items');
