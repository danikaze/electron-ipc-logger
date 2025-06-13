export function safeJsonStringify(obj: any) {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    if (error?.name === 'TypeError' && error?.message?.includes('circular')) {
      return 'Circular JSON';
    }

    console.warn(error, obj);
    return 'Error parsing JSON';
  }
}
