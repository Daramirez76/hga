<?php

namespace App\Services;

use App\Repositories\Interfaces\residentesInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class residentesService
{
    protected $residentesRepository;

    public function __construct(
        residentesInterface $residentesRepository,
        protected AccessScopeService $accessScopeService,
        protected notificacionesService $notificacionesService,
        protected QueryPaginationService $paginationService
    ) {
        $this->residentesRepository = $residentesRepository;
    }
  
    public function getAllresidentes(?int $page = 1, ?int $perPage = 5, ?string $search = null, bool $paginate = false): array
    {
        $residentes = $this->accessScopeService->filterResidents(
            Collection::make($this->residentesRepository->getAllresidentes())
        );

        $residentes = $this->paginationService->filterCollection($residentes, $search, [
            'cod_residente',
            'nombre',
            'apellido',
            'edad',
            'patologia',
            'RH',
            'cod_usuario',
            'cod_rol',
        ]);

        if (!$paginate) {
            return [
                'data' => $residentes->values()->all(),
                'meta' => [],
            ];
        }

        return $this->paginationService->paginateCollection($residentes, $page, $perPage, [], $search);
    }

    public function getresidentesById(int $id)
    {
        $residente = $this->residentesRepository->getresidentesById($id);

        if (!$residente) {
            return null;
        }

        return $this->accessScopeService->canAccessResidentRecord($residente) ? $residente : null;
    }

    public function create(array $data)
    {
        $data = $this->normalizePayload($data);

        if (empty($data['cod_residente'])) {
            $data['cod_residente'] = $this->residentesRepository->getNextCodResidente();
        }

        $data['cod_usuario'] = $this->resolveTutorCode($data['cod_usuario'] ?? null);

        if (!isset($data['cod_rol']) || empty($data['cod_rol'])) {
            $data['cod_rol'] = 3;
        }

        $residente = $this->residentesRepository->create($data);
        $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyResidenteCreated($residente));

        return $residente;
    }

    public function update(int $id, array $data)
    {
        $data = $this->normalizePayload($data);

        if (array_key_exists('cod_usuario', $data)) {
            $data['cod_usuario'] = $this->resolveTutorCode($data['cod_usuario']);
        }

        $residente = $this->residentesRepository->update($id, $data);

        if ($residente) {
            $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyResidenteUpdated($residente));
        }

        return $residente;
    }

    public function delete(int $id)
    {
        $residente = $this->getresidentesById($id);

        if (!$residente) {
            return null;
        }

        $deleted = $this->residentesRepository->delete($id);

        if ($deleted) {
            $this->dispatchNotificationSafely(fn () => $this->notificacionesService->notifyResidenteDeleted($residente));
        }

        return $deleted;
    }

    protected function normalizePayload(array $data): array
    {
        if (isset($data['rh']) && !isset($data['RH'])) {
            $data['RH'] = strtoupper((string) $data['rh']);
        }

        unset($data['rh']);

        if (isset($data['cod_residente'])) {
            $data['cod_residente'] = (int) $data['cod_residente'];
        }

        if (isset($data['edad'])) {
            $data['edad'] = (int) $data['edad'];
        }

        if (isset($data['cod_usuario'])) {
            $data['cod_usuario'] = (int) $data['cod_usuario'];
        }

        if (isset($data['cod_rol'])) {
            $data['cod_rol'] = (int) $data['cod_rol'];
        }

        return $data;
    }

    protected function resolveTutorCode(mixed $candidate): int
    {
        $candidate = (int) ($candidate ?? 0);

        if ($candidate > 0) {
            return $candidate;
        }

        $user = Auth::guard('api')->user();
        $userRoleCode = (int) ($user->cod_rol ?? 0);
        $userDocId = (int) ($user->doc_id ?? $user->id ?? 0);

        if ($userRoleCode === 4 && $userDocId > 0) {
            return $userDocId;
        }

        throw ValidationException::withMessages([
            'cod_usuario' => 'Debes seleccionar un tutor responsable para este residente.',
        ]);
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
