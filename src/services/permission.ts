import { TransactionBaseService } from '@medusajs/medusa';
import { Permission } from '../models/permission';
import PermissionRepository from '../repositories/permission';
import { MedusaError } from '@medusajs/utils';

export type CreatePayload = Pick<Permission, 'name' | 'metadata'>;

type InjectedDependencies = {
  permissionRepository: typeof PermissionRepository;
};

class PermissionService extends TransactionBaseService {
  protected readonly permissionRepository_: typeof PermissionRepository;

  constructor(container: InjectedDependencies) {
    super(container);
    this.permissionRepository_ = container.permissionRepository;
  }

  async create(data: CreatePayload) {
    return this.atomicPhase_(async (manager) => {
      const permissionRepo = manager.withRepository(this.permissionRepository_);
      const permission = permissionRepo.create(data);

      const result = await permissionRepo.save(permission);

      return result;
    });
  }

  async update(id: string, data: Partial<CreatePayload>): Promise<Permission> {
    return this.atomicPhase_(async (manager) => {
      const permissionRepo = manager.withRepository(this.permissionRepository_);

      const existingPermission = await permissionRepo.findOne({
        where: { id },
      });

      if (!existingPermission) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, `Permission with id ${id} not found`);
      }

      Object.assign(existingPermission, data);

      const updatedPermission = await permissionRepo.save(existingPermission);

      return updatedPermission;
    });
  }

  async deletePermission(permission: Permission): Promise<void> {
    return this.atomicPhase_(async (manager) => {
      const permissionRepo = manager.withRepository(this.permissionRepository_);
      await permissionRepo.remove(permission);
    });
  }
}

export default PermissionService;
