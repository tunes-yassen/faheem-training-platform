import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SettingCategory } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/auth.decorators';
import {
  BulkUpsertSettingsDto,
  CreatePolicyDto,
  CreateRoleDto,
  UpdateRolePermissionsDto,
  UpdateUserStatusDto,
  UpsertCmsPageDto,
  UpsertSettingDto,
} from './dto/admin-settings.dto';

@Injectable()
export class AdminSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
  ) {}

  private serializeSetting(setting: any) {
    return {
      id: setting.id,
      key: setting.key,
      category: setting.category,
      labelAr: setting.labelAr,
      description: setting.description,
      isSecret: setting.isSecret,
      value: setting.isSecret ? this.crypto.maskSecret(setting.value) : setting.value,
      hasValue: Boolean(setting.value),
      updatedAt: setting.updatedAt,
    };
  }

  async getSettings(category?: SettingCategory) {
    const settings = await this.prisma.systemSetting.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    const serialized = settings.map((s) => this.serializeSetting(s));
    const grouped: Record<string, any[]> = {};
    for (const item of serialized) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }

    return {
      items: serialized,
      grouped,
    };
  }

  async getDecryptedValue(key: string): Promise<string | null> {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) return null;
    return setting.isSecret ? this.crypto.decrypt(setting.value) : setting.value;
  }

  async upsertSetting(
    key: string,
    dto: UpsertSettingDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.systemSetting.findUnique({ where: { key } });
    const isSecret = dto.isSecret ?? existing?.isSecret ?? false;

    // If UI sends back a masked placeholder (e.g. ****1234), preserve existing encrypted value
    let storedValue = dto.value;
    if (isSecret && existing && /^\*{4,}/.test(dto.value)) {
      storedValue = existing.value;
    } else if (isSecret && dto.value) {
      storedValue = this.crypto.encrypt(dto.value);
    }

    const updated = await this.prisma.systemSetting.upsert({
      where: { key },
      create: {
        key,
        category: dto.category,
        labelAr: dto.labelAr,
        description: dto.description,
        value: storedValue,
        isSecret,
        updatedById: actor.id,
      },
      update: {
        category: dto.category,
        labelAr: dto.labelAr,
        description: dto.description,
        value: storedValue,
        isSecret,
        updatedById: actor.id,
      },
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'SYSTEM_SETTING_UPDATED',
      entityType: 'SystemSetting',
      entityId: updated.id,
      beforeData: existing ? this.serializeSetting(existing) : null,
      afterData: this.serializeSetting(updated),
      ipAddress,
    });

    return this.serializeSetting(updated);
  }

  async bulkUpsertSettings(
    dto: BulkUpsertSettingsDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const results: any[] = [];
    for (const item of dto.settings) {
      results.push(await this.upsertSetting(item.key, item, actor, ipAddress));
    }
    return { updatedCount: results.length, items: results };
  }

  async deleteSetting(key: string, actor: AuthenticatedUser, ipAddress?: string) {
    const existing = await this.prisma.systemSetting.findUnique({ where: { key } });
    if (!existing) throw new NotFoundException('الإعداد غير موجود');

    await this.prisma.systemSetting.delete({ where: { key } });
    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'SYSTEM_SETTING_DELETED',
      entityType: 'SystemSetting',
      entityId: existing.id,
      beforeData: this.serializeSetting(existing),
      ipAddress,
    });
    return { deleted: true, key };
  }

  // Policies
  async listPolicies() {
    return this.prisma.policyVersion.findMany({
      orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createPolicy(dto: CreatePolicyDto, actor: AuthenticatedUser, ipAddress?: string) {
    const policy = await this.prisma.$transaction(async (tx) => {
      if (dto.isActive) {
        await tx.policyVersion.updateMany({
          where: { type: dto.type, isActive: true },
          data: { isActive: false },
        });
      }
      return tx.policyVersion.create({
        data: {
          type: dto.type,
          version: dto.version,
          titleAr: dto.titleAr,
          contentAr: dto.contentAr,
          rulesJson: dto.rulesJson,
          isActive: dto.isActive ?? false,
          createdById: actor.id,
        },
      });
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'POLICY_CREATED',
      entityType: 'PolicyVersion',
      entityId: policy.id,
      afterData: policy,
      ipAddress,
    });

    return policy;
  }

  async activatePolicy(id: string, actor: AuthenticatedUser, ipAddress?: string) {
    const target = await this.prisma.policyVersion.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('السياسة غير موجودة');

    const activated = await this.prisma.$transaction(async (tx) => {
      await tx.policyVersion.updateMany({
        where: { type: target.type, isActive: true },
        data: { isActive: false },
      });
      return tx.policyVersion.update({
        where: { id },
        data: { isActive: true },
      });
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'POLICY_ACTIVATED',
      entityType: 'PolicyVersion',
      entityId: activated.id,
      afterData: activated,
      ipAddress,
    });

    return activated;
  }

  // CMS Pages
  async listCmsPages() {
    return this.prisma.cmsPage.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  async getPublicCmsPage(slug: string) {
    const page = await this.prisma.cmsPage.findUnique({ where: { slug } });
    if (!page || !page.isPublished) {
      throw new NotFoundException('الصفحة غير موجودة');
    }
    return page;
  }

  async createCmsPage(dto: UpsertCmsPageDto, actor: AuthenticatedUser, ipAddress?: string) {
    const page = await this.prisma.cmsPage.create({ data: dto });
    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'CMS_PAGE_CREATED',
      entityType: 'CmsPage',
      entityId: page.id,
      afterData: page,
      ipAddress,
    });
    return page;
  }

  async updateCmsPage(
    id: string,
    dto: Partial<UpsertCmsPageDto>,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.cmsPage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('الصفحة غير موجودة');
    const updated = await this.prisma.cmsPage.update({ where: { id }, data: dto });
    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'CMS_PAGE_UPDATED',
      entityType: 'CmsPage',
      entityId: updated.id,
      beforeData: existing,
      afterData: updated,
      ipAddress,
    });
    return updated;
  }

  async deleteCmsPage(id: string, actor: AuthenticatedUser, ipAddress?: string) {
    const existing = await this.prisma.cmsPage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('الصفحة غير موجودة');
    await this.prisma.cmsPage.delete({ where: { id } });
    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'CMS_PAGE_DELETED',
      entityType: 'CmsPage',
      entityId: id,
      beforeData: existing,
      ipAddress,
    });
    return { deleted: true, id };
  }

  // RBAC Matrix
  async listRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async listPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { code: 'asc' }] });
  }

  async createRole(dto: CreateRoleDto, actor: AuthenticatedUser, ipAddress?: string) {
    const role = await this.prisma.role.create({
      data: {
        code: dto.code.toUpperCase(),
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        description: dto.description,
      },
    });
    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'ROLE_CREATED',
      entityType: 'Role',
      entityId: role.id,
      afterData: role,
      ipAddress,
    });
    return role;
  }

  async updateRolePermissions(
    roleId: string,
    dto: UpdateRolePermissionsDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('الدور غير موجود');
    if (role.code === 'SUPER_ADMIN') {
      throw new BadRequestException('لا يمكن تعديل صلاحيات المدير العام');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      if (dto.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({ roleId, permissionId })),
          skipDuplicates: true,
        });
      }
    });

    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'ROLE_PERMISSIONS_UPDATED',
      entityType: 'Role',
      entityId: roleId,
      afterData: { permissionIds: dto.permissionIds },
      ipAddress,
    });

    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } },
    });
  }

  // Audit Logs (Read-only)
  async listAuditLogs(query: {
    action?: string;
    entityType?: string;
    actorId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
    const where: any = {};
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
    if (query.entityType) where.entityType = query.entityType;
    if (query.actorId) where.actorId = query.actorId;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { include: { profile: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  // Users directory
  async listUsers(query: { role?: string; status?: string; search?: string }) {
    const where: any = {};
    if (query.role) where.role = { code: query.role };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { profile: { fullName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      include: { role: true, profile: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async updateUserStatus(
    userId: string,
    dto: UpdateUserStatusDto,
    actor: AuthenticatedUser,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new NotFoundException('المستخدم غير موجود');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: dto.status },
      include: { role: true, profile: true },
    });
    await this.audit.log({
      actorId: actor.id,
      actorRole: actor.roleCode,
      action: 'USER_STATUS_UPDATED',
      entityType: 'User',
      entityId: userId,
      beforeData: { status: existing.status },
      afterData: { status: updated.status },
      ipAddress,
    });
    return updated;
  }
}
