import { CategoryType } from '../enums/category-type.enum';

export class CategoryTreeDto {
  id: string;
  parentId: string | null;
  type: CategoryType;
  name: string;
  slug: string;
  children: CategoryTreeDto[];
}
