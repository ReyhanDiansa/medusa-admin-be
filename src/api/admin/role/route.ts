import type { MedusaRequest, MedusaResponse } from '@medusajs/medusa';
import RoleService from '../../../services/role';

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const roleService = req.scope.resolve<RoleService>('roleService');

  const role = await roleService.list();

  res.status(200).json({
    role,
  });
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { name, store_id, permissions = [] } = req.body;

  const roleService = req.scope.resolve('roleService') as RoleService;

  const role = await roleService.create({
    name,
    store_id,
    permissions,
  });

  res.json(role);
};
