import AuditLogsTable from './AuditLogsTable';
import AuditLogsCard from './AuditLogsCard';
import ViewToggle from '../../components/ViewToggle';

export default function AuditLogs() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
      </div>

      <ViewToggle
        storageKey="auditLogsViewMode"
        tableView={<AuditLogsTable />}
        cardView={<AuditLogsCard />}
      />
    </div>
  );
}
