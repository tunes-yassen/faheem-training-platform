import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AuthenticatedUser,
  PERMISSIONS_KEY,
  ROLES_KEY,
} from '../decorators/auth.decorators';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length && !requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    if (!user) {
      throw new ForbiddenException('غير مصرح بالوصول');
    }

    if (user.roleCode === 'SUPER_ADMIN') {
      return true;
    }

    if (requiredRoles?.length && !requiredRoles.includes(user.roleCode)) {
      throw new ForbiddenException('لا تملك الصلاحية المطلوبة لهذا الإجراء');
    }

    if (requiredPermissions?.length) {
      const hasAll = requiredPermissions.every((p) => user.permissions.includes(p));
      if (!hasAll) {
        throw new ForbiddenException('صلاحياتك غير كافية لتنفيذ هذا الإجراء');
      }
    }

    return true;
  }
}
