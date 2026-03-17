<?php

namespace App\Services;

use App\Http\Requests\residentesRequest;
use App\Repositories\Interfaces\residentesInterface;
use Illuminate\Support\Str;

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

    public function getresidentesById($id)
    {
        return $this->residentesRepository->getresidentesById($id);
    }

    public function create(residentesRequest $request)
    {
        $data = $request->validated();
        
        // Normalizar campo 'rh' a 'RH' si viene en minúsculas
        if (isset($data['rh']) && !isset($data['RH'])) {
            $data['RH'] = strtoupper($data['rh']);
            unset($data['rh']);
        }
        
        // Generar cod_residente si no viene
        if (empty($data['cod_residente'])) {
            $data['cod_residente'] = 'RES-' . date('Ymd') . '-' . Str::random(6);
        }
        
        // Asignar cod_usuario del usuario autenticado
        if (!isset($data['cod_usuario']) || empty($data['cod_usuario'])) {
            $user = auth()->user();
            $data['cod_usuario'] = $user ? $user->id : 1;
        }
        
        // Asignar cod_rol (por defecto asignamos 3 para residentes)
        if (!isset($data['cod_rol']) || empty($data['cod_rol'])) {
            $data['cod_rol'] = 3; // Role ID para residentes
        }
        
        return $this->residentesRepository->createresidentes($data);
    }

    public function update($id, residentesRequest $request)
    {
        $data = $request->validated();
        
        // Normalizar campo 'rh' a 'RH' si viene en minúsculas
        if (isset($data['rh']) && !isset($data['RH'])) {
            $data['RH'] = strtoupper($data['rh']);
            unset($data['rh']);
        }
        
        return $this->residentesRepository->update($id, $data);
    }

    public function delete($id)
    {
        return $this->residentesRepository->delete($id);
    }
}