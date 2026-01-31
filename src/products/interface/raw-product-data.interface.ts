/**
 * Representa la estructura cruda retornada por la función PostgreSQL b2b.fn_get_products()
 * Los nombres de propiedades están en snake_case porque vienen directamente de la base de datos
 */
export interface RawProductData {
  id: string;
  slug: string;
  store_id: number | null;
  sku: string | null;
  name: string | null;
  description: string | null;
  price: number | null;
  stock_quantity: number | null;
  is_active: boolean;
  price_list: number | null;
  price_base: number | null;
  image_uri: string | null;
  trending: boolean;
  rating: number | null;
  status: boolean;
  created_at: Date | string;
  updated_at: Date | string | null;
}
