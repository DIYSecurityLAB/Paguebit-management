import { apiDataSource } from "../datasource/api.datasource";
import type { 
  DashboardMeta,
  DashboardUser,
  DashboardPayment,
  DashboardWithdrawal,
  DashboardStore,
  DashboardRawData
} from '../../domain/entities/DashboardRawData.entity';

type EntityKey = 'users' | 'payments' | 'withdrawals' | 'stores';
interface MetaResponse { meta: DashboardMeta }

export class DashboardRawDataRepository {
  private readonly basePath = '/admin/dashboard-raw-data';

  private async getMeta(): Promise<DashboardMeta> {
    const { meta } = await apiDataSource.get<MetaResponse>(`${this.basePath}?entity=meta`);
    return meta;
  }

  private async getEntityBatch<T>(entity: EntityKey, batch: number): Promise<T[]> {
    const data = await apiDataSource.get<{ [k in EntityKey]?: T[] }>(
      `${this.basePath}?entity=${entity}&batch=${batch}`
    );
    return (data as any)[entity] || [];
  }

  private async fetchAllOf<T>(entity: EntityKey, total: number, batchSize: number): Promise<T[]> {
    const totalBatches = Math.ceil(total / batchSize);
    const aggregated: T[] = [];
    for (let b = 0; b < totalBatches; b++) {
      // eslint-disable-next-line no-await-in-loop
      const batch = await this.getEntityBatch<T>(entity, b);
      aggregated.push(...batch);
    }
    return aggregated;
  }

  async fetchAll(): Promise<DashboardRawData> {
    const meta = await this.getMeta();

    const [users, payments, withdrawals, stores] = await Promise.all([
      this.fetchAllOf<DashboardUser>('users', meta.users, meta.batchSize),
      this.fetchAllOf<DashboardPayment>('payments', meta.payments, meta.batchSize),
      this.fetchAllOf<DashboardWithdrawal>('withdrawals', meta.withdrawals, meta.batchSize),
      this.fetchAllOf<DashboardStore>('stores', meta.stores, meta.batchSize),
    ]);

    return { meta, users, payments, withdrawals, stores };
  }
}
