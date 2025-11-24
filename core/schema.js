export function validateSchema(data, schema) {
  const errors = [];
  if (schema.type && typeof data !== schema.type) errors.push(`Expected type ${schema.type}, got ${typeof data}`);
  if (schema.required && Array.isArray(schema.required)) {
    schema.required.forEach(field => { if (!(field in data)) errors.push(`Missing required field: ${field}`); });
  }
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([key, propSchema]) => {
      if (key in data) {
        const propErrors = validateSchema(data[key], propSchema);
        errors.push(...propErrors.map(e => `${key}.${e}`));
      }
    });
  }
  return errors;
}