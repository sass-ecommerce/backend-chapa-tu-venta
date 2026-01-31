/**
 * Convierte una cadena de snake_case a camelCase
 * @param str - String en formato snake_case
 * @returns String en formato camelCase
 * @example snakeToCamel('store_id') => 'storeId'
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Transforma las keys de un objeto de snake_case a camelCase
 * @param obj - Objeto con keys en snake_case
 * @returns Nuevo objeto con keys en camelCase
 */
export function transformKeysToCamelCase<T = any>(obj: Record<string, any>): T {
  const transformed: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = snakeToCamel(key);
      transformed[camelKey] = obj[key];
    }
  }

  return transformed as T;
}

/**
 * Transforma un array de objetos de snake_case a camelCase
 * @param array - Array de objetos con keys en snake_case
 * @returns Nuevo array con objetos transformados a camelCase
 */
export function transformArrayToCamelCase<T = any>(
  array: Record<string, any>[],
): T[] {
  return array.map((item) => transformKeysToCamelCase<T>(item));
}
