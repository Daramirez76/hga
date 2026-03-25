<?php

namespace App\Services;

use App\Repositories\Interfaces\residentesInterface;
use Illuminate\Support\Facades\Auth;

class residentesService
{
    protected $residentesRepository;

    public function __construct(residentesInterface $residentesRepository)
    {
        $this->residentesRepository = $residentesRepository;
    }
  
    public function getAllresidentes()
    {
        return $this->residentesRepository->getAllresidentes();
    }

    public function getresidentesById(int $id)
    {
        return $this->residentesRepository->getresidentesById($id);
    }

    public function create(array $data)
    {
        $data = $this->normalizePayload($data);

        if (empty($data['cod_residente'])) {
            $data['cod_residente'] = $this->residentesRepository->getNextCodResidente();
        }

        if (!isset($data['cod_usuario']) || empty($data['cod_usuario'])) {
            $user = Auth::guard('api')->user();
            $data['cod_usuario'] = $user ? $user->id : 1;
        }

        if (!isset($data['cod_rol']) || empty($data['cod_rol'])) {
            $data['cod_rol'] = 3;
        }

        return $this->residentesRepository->create($data);
    }

    public function update(int $id, array $data)
    {
        $data = $this->normalizePayload($data);

        return $this->residentesRepository->update($id, $data);
    }

    public function delete(int $id)
    {
        return $this->residentesRepository->delete($id);
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
}
