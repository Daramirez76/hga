<?php

namespace App\Services;

use App\Http\Requests\residentesRequest;
use App\repositories\Interfaces\residentesRepository;

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

    public function createresidentes(residentesRequest $request)
    {
        return $this->residentesRepository->createresidentes($request->validated());
    }

    public function updateresidentes($id, residentesRequest $request)
    {
        return $this->residentesRepository->update($id, $request->validated());
    }

    public function deleteresidentes($id)
    {
        return $this->residentesRepository->delete($id);
    }
}