<?php

namespace App\Services;

use App\Repositories\Interfaces\medicamentosInterface;
use Illuminate\Support\Facades\Auth;

class medicamentosService
{
    protected medicamentosInterface $medicamentosRepository;

    public function __construct(
        medicamentosInterface $medicamentosRepository,
        protected notificacionesService $notificacionesService,
        protected QueryPaginationService $paginationService
    ) {
        $this->medicamentosRepository = $medicamentosRepository;
    }

    public function getAllmedicamentos(?int $page = 1, ?int $perPage = 5, ?string $search = null, bool $paginate = false): array
    {
        $medicamentos = collect($this->medicamentosRepository->getAllmedicamentos());

        $medicamentos = $this->paginationService->filterCollection($medicamentos, $search, [
            'Cod_medicamento',
            'nombre_medic',
            'fecha_entrada',
            'fecha_vencimiento',
            'cod_usuario',
            'cod_residente',
            'cod_rol',
            'descrip_novedad',
            'fecha_novedad',
            'stock',
        ]);

        if (!$paginate) {
            return [
                'data' => $medicamentos->values()->all(),
                'meta' => [],
            ];
        }

        return $this->paginationService->paginateCollection($medicamentos, $page, $perPage, [], $search);
    }

    public function getmedicamentosById(int $id)
    {
        return $this->medicamentosRepository->getmedicamentosById($id);
    }

    public function create(array $data)
    {
        $data = $this->normalizePayload($data);
        $user = Auth::guard('api')->user();

        if (!isset($data['cod_usuario']) || empty($data['cod_usuario'])) {
            $data['cod_usuario'] = $this->resolveAuthenticatedUserCode();
        }

        if (!isset($data['cod_rol']) || empty($data['cod_rol'])) {
            $data['cod_rol'] = (int) ($user->cod_rol ?? 6);
        }

        if (!isset($data['descrip_novedad']) || empty($data['descrip_novedad'])) {
            $data['descrip_novedad'] = 'Ingreso de medicamento';
        }

        if (!isset($data['fecha_novedad']) || empty($data['fecha_novedad'])) {
            $data['fecha_novedad'] = now()->toDateString();
        }

        $medicamento = $this->medicamentosRepository->create($data);
        $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyMedicamentoCreated($medicamento));

        return $medicamento;
    }

    public function update(int $id, array $data)
    {
        $data = $this->normalizePayload($data);

        $medicamento = $this->medicamentosRepository->update($id, $data);

        if ($medicamento) {
            $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyMedicamentoUpdated($medicamento));
        }

        return $medicamento;
    }

    public function delete(int $id)
    {
        $medicamento = $this->getmedicamentosById($id);

        if (!$medicamento) {
            return null;
        }

        $deleted = $this->medicamentosRepository->delete($id);

        if ($deleted) {
            $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyMedicamentoDeleted($medicamento));
        }

        return $deleted;
    }

    protected function normalizePayload(array $data): array
    {
        if (isset($data['cod_medicamento']) && !isset($data['Cod_medicamento'])) {
            $data['Cod_medicamento'] = $data['cod_medicamento'];
        }

        unset($data['cod_medicamento']);

        if (isset($data['Cod_medicamento'])) {
            $data['Cod_medicamento'] = (int) $data['Cod_medicamento'];
        }

        if (isset($data['cod_usuario'])) {
            $data['cod_usuario'] = (int) $data['cod_usuario'];
        }

        if (isset($data['cod_residente'])) {
            $data['cod_residente'] = (int) $data['cod_residente'];
        }

        if (isset($data['cod_rol'])) {
            $data['cod_rol'] = (int) $data['cod_rol'];
        }

        if (isset($data['stock'])) {
            $data['stock'] = (int) $data['stock'];
        }

        if (isset($data['nombre_medic'])) {
            $data['nombre_medic'] = trim((string) $data['nombre_medic']);
        }

        if (isset($data['descrip_novedad'])) {
            $data['descrip_novedad'] = trim((string) $data['descrip_novedad']);
        }

        return $data;
    }

    protected function resolveAuthenticatedUserCode(): int
    {
        $user = Auth::guard('api')->user();
        $docId = (int) ($user->doc_id ?? $user->id ?? 0);

        return $docId > 0 ? $docId : 1;
    }

    protected function dispatchNotificationSafely(callable $callback): void
    {
        try {
            $callback();
        } catch (\Throwable $exception) {
            report($exception);
        }
    }
}
