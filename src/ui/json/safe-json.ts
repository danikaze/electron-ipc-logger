export function safeJsonStringify(obj: any) {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error(error, obj);
    return 'Error parsing JSON';
  }
}