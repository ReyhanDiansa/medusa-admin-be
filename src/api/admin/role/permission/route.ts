import type { MedusaRequest, MedusaResponse } from '@medusajs/medusa';
import RoleService from 'src/services/role';

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { role, user_id } = req.body;

  const roleService = req.scope.resolve('roleService') as RoleService;
  const Role = await roleService.associateUser(role, user_id);

  res.json(Role);
};
