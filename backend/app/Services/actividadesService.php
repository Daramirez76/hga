<?php

namespace App\Services;

use App\Http\Requests\actividadesRequest;
use App\Repositories\Interfaces\actividadesInterface;

class actividadesService
{
    protected $actividadesRepository;

    public function __construct(actividadesInterface $actividadesRepository)
    {
        $this->actividadesRepository = $actividadesRepository;
    }

    public function getAllActividades()
    {
        return $this->actividadesRepository->getAllactividades();
    }

    public function getActividadesById($id)
    {
        return $this->actividadesRepository->getactividadesById($id);
    }

    public function create(actividadesRequest $request)
    {
        $data = $request->validated();
        
        // Auto-generar Cod_acti_ludi si no viene
        if (empty($data['Cod_acti_ludi'])) {
            $data['Cod_acti_ludi'] = (int)(date('Ymd') . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT));
        }
        
        // Asignar doc_id del usuario autenticado
        if (!isset($data['doc_id']) || empty($data['doc_id'])) {
            $user = auth()->user();
            $data['doc_id'] = $user ? $user->id : 1;
        }
        
        // Asignar cod_rol por defecto si no viene
        if (!isset($data['cod_rol']) || empty($data['cod_rol'])) {
            $data['cod_rol'] = 2; // Role por defecto
        }
        
        return $this->actividadesRepository->createactividades($data);
    }

    public function update($id, actividadesRequest $request)
    {
        $data = $request->validated();
        return $this->actividadesRepository->updateactividades($id, $data);
    }

    public function delete($id)
    {
        return $this->actividadesRepository->deleteactividades($id);
    }
}
