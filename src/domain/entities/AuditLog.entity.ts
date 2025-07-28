import { AuditLogModel } from "../../data/model/audit.model";

export class AuditLog {
  id: string;
  action: string;
  userId?: string;
  paymentId?: string;
  withdrawalId?: string;
  notificationId?: string;
  affectedUserId?: string;
  storeId?: string;
  whitelabelId?: string;
  performedBy?: string;
  previousValue?: string;
  newValue?: string;
  createdAt: Date | string;
  user?: { id: string; name: string; email: string };
  affectedUser?: { id: string; name: string; email: string };

  constructor(model: AuditLogModel) {
    this.id = model.id;
    this.action = model.action;
    this.userId = model.userId;
    this.paymentId = model.paymentId;
    this.withdrawalId = model.withdrawalId;
    this.notificationId = model.notificationId;
    this.affectedUserId = model.affectedUserId;
    this.storeId = model.storeId;
    this.whitelabelId = model.whitelabelId;
    this.performedBy = model.performedBy;
    this.previousValue = model.previousValue;
    this.newValue = model.newValue;
    this.createdAt = model.createdAt;
    this.user = model.user;
    this.affectedUser = model.affectedUser;
  }

  static fromModel(model: AuditLogModel): AuditLog {
    return new AuditLog(model);
  }
}
