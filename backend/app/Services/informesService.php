<?php

namespace App\Services;

use App\Http\Requests\informesRequest;
use App\Repositories\Interfaces\informesInterface;

class informesService
{
    protected $informesRepository;

    public function __construct(informesInterface $informesRepository)
    {
        $this->informesRepository = $informesRepository;
    }

    public function getAllinformes()
    {
        return $this->informesRepository->getAllinformes();
    }

    public function getinformesById($id)
    {
        return $this->informesRepository->getinformesById($id);
    }

    public function create(informesRequest $request)
    {
        $data = $request->validated();
        
        // Auto-generar cod_Informes si no viene
        if (empty($data['cod_Informes'])) {
            $data['cod_Informes'] = (int)(date('Ymd') . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT));
        }
        
        // Asignar doc_id del usuario autenticado
        if (!isset($data['doc_id']) || empty($data['doc_id'])) {
            $user = auth()->user();
            $data['doc_id'] = $user ? $user->id : 1;
        }
        
        // Valores por defecto
        if (!isset($data['cod_Residente']) || empty($data['cod_Residente'])) {
            $data['cod_Residente'] = 1;
        }
        
        if (!isset($data['cod_rol']) || empty($data['cod_rol'])) {
            $data['cod_rol'] = 1;
        }
        
        if (!isset($data['tipo']) || empty($data['tipo'])) {
            $data['tipo'] = 'general';
        }
        
        if (!isset($data['urgencia']) || empty($data['urgencia'])) {
            $data['urgencia'] = 'normal';
        }
        
        return $this->informesRepository->createinformes($data);
    }

    public function update($id, informesRequest $request)
    {
        $data = $request->validated();
        return $this->informesRepository->updateinformes($id, $data);
    }

    public function delete($id)
    {
        return $this->informesRepository->deleteinformes($id);
    }
}
