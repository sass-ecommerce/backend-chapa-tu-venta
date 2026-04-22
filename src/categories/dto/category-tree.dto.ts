export class CategoryTreeDto {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  children: CategoryTreeDto[];
}
