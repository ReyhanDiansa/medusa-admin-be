import { TransactionBaseService } from '@medusajs/medusa';
import { Role } from '../models/role';
import RoleRepository from '../repositories/role';
import PermissionService, { CreatePayload as PermissionCreatePayload } from './permission';
import UserService from './user';
import { MedusaError } from '@medusajs/utils';

type CreatePayload = Pick<Role, 'name' | 'store_id'> & {
  permissions?: PermissionCreatePayload[];
};

type InjectedDependencies = {
  roleRepository: typeof RoleRepository;
  permissionService: PermissionService;
  userService: UserService;
};

class RoleService extends TransactionBaseService {
  protected readonly roleRpository_: typeof RoleRepository;
  protected readonly permissionService_: PermissionService;
  protected readonly userService_: UserService;

  constructor(container: InjectedDependencies) {
    super(container);

    this.roleRpository_ = container.roleRepository;
    this.permissionService_ = container.permissionService;
    this.userService_ = container.userService;
  }

  async list(): Promise<Role[]> {
    const roleRepo = this.activeManager_.withRepository(this.roleRpository_);
    return await roleRepo.find({
      relations: ['users', 'permissions'],
      skip: 0,
      take: 20,
    });
  }

  async retrieve(id: string): Promise<Role> {
    const roleRepo = this.manager_.withRepository(this.roleRpository_);
    const role = await roleRepo.findOne({
      where: {
        id,
      },
      relations: ['permissions', 'store', 'users'],
    });

    if (!role) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Role with id ${id} not found`);
    }

    return role;
  }

  async create(data: CreatePayload): Promise<Role> {
    return this.atomicPhase_(async (manager) => {
      const { permissions: permissionsData = [] } = data;
      delete data.permissions;

      const roleRepo = manager.withRepository(this.roleRpository_);
      const role = roleRepo.create(data);

      role.permissions = [];

      for (const permissionData of permissionsData) {
        role.permissions.push(await this.permissionService_.create(permissionData));
      }
      const result = await roleRepo.save(role);

      return await this.retrieve(result.id);
    });
  }

  async update(id: string, data: Partial<CreatePayload>): Promise<Role> {
    return this.atomicPhase_(async (manager) => {
      const roleRepo = manager.withRepository(this.roleRpository_);

      const existingRole = await roleRepo.findOne({
        where: { id },
        relations: ['permissions', 'store', 'users'],
      });

      if (!existingRole) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, `Role with id ${id} not found`);
      }

      Object.assign(existingRole, data);

      if (data.permissions) {
        existingRole.permissions = await Promise.all(
          data.permissions.map(async (permissionData) => {
            let existingPermission = existingRole.permissions.find((permission) => permission.name === permissionData.name);

            if (existingPermission) {
              existingPermission = Object.assign(existingPermission, permissionData);
              return await this.permissionService_.update(existingPermission.id, permissionData);
            } else {
              return await this.permissionService_.create(permissionData);
            }
          })
        );
      }

      const updatedRole = await roleRepo.save(existingRole);

      return await this.retrieve(updatedRole.id);
    });
  }

  async associateUser(role_id: string, user_id: string): Promise<Role> {
    return this.atomicPhase_(async () => {
      await this.userService_.update(user_id, {
        role_id,
      });

      return await this.retrieve(role_id);
    });
  }

  async delete(id: string): Promise<void> {
    return this.atomicPhase_(async (manager) => {
      const roleRepo = manager.withRepository(this.roleRpository_);

      const existingRole = await roleRepo.findOne({
        where: { id },
        relations: ['permissions', 'store', 'users'],
      });

      if (!existingRole) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, `Role with id ${id} not found`);
      }

      if (existingRole.permissions) {
        await Promise.all(existingRole.permissions.map((permission) => this.permissionService_.deletePermission(permission)));
      }

      await roleRepo.remove(existingRole);
    });
  }
}

export default RoleService;
