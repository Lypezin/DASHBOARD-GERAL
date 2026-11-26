export default function PerfilLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando perfil"
      className="min-h-full bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_34%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="dashboard-loading-shimmer h-24 w-full rounded-[1.65rem]" />
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="dashboard-loading-shimmer h-[400px] w-full rounded-[1.65rem]" />
          <div className="dashboard-loading-shimmer h-[400px] w-full rounded-[1.65rem]" />
        </div>
      </div>
    </div>
  );
}
