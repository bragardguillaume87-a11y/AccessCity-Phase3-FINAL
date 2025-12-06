export function validateSchema(data, schema) {
  const errors = [];
  
  if (!schema) return errors;
  
  if (schema.type) {
    const actualType = Array.isArray(data) ? 'array' : typeof data;
    
    if (Array.isArray(schema.type)) {
        // Support for multiple types e.g. ["string", "number"]
        if (!schema.type.includes(actualType)) {
            errors.push(`Expected type ${schema.type.join(',')}, got ${actualType}`);
        }
    } else {
        if (schema.type === 'array' && !Array.isArray(data)) {
            errors.push(`Expected type array, got ${typeof data}`);
        } else if (schema.type !== 'array' && typeof data !== schema.type) {
            errors.push(`Expected type ${schema.type}, got ${typeof data}`);
        }
    }
  }
  
  if (schema.required && Array.isArray(schema.required)) {
    schema.required.forEach(field => { 
      if (!(field in data)) errors.push(`Missing required field: ${field}`); 
    });
  }
  
  if (schema.properties && typeof data === 'object' && !Array.isArray(data)) {
    Object.entries(schema.properties).forEach(([key, propSchema]) => {
      if (key in data) {
        const propErrors = validateSchema(data[key], propSchema);
        errors.push(...propErrors.map(e => `${key}.${e}`));
      }
    });
  }
  
  if (schema.items && Array.isArray(data)) {
    data.forEach((item, index) => {
      const itemErrors = validateSchema(item, schema.items);
      errors.push(...itemErrors.map(e => `[${index}].${e}`));
    });
  }
  
  return errors;
}