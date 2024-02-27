import type { MedusaRequest, MedusaResponse } from '@medusajs/medusa';
import RoleService from '../../../../services/role';

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const roleService = req.scope.resolve<RoleService>('roleService');

  const role = await roleService.retrieve(req.params.id);

  res.status(200).json({
    role,
  });
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;
  const { name, store_id, permissions = [] } = req.body;

  const roleService = req.scope.resolve('roleService') as RoleService;

  const update = await roleService.update(id, { name, store_id, permissions });

  res.json({ update });
};

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const roleService: RoleService = req.scope.resolve('roleService');

  await roleService.delete(req.params.id);

  res.status(200).json({
    message: 'Deleted',
  });
};
