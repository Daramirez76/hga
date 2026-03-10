<?php

namespace App\Services;

use App\Http\Requests\informesRequest;
use App\repositories\Interfaces\informesRepository;

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

    public function createinformes(informesRequest $request)
    {
        return $this->informesRepository->createinformes($request->validated());
    }

    public function updateinformes($id, informesRequest $request)
    {
        return $this->informesRepository->updateinformes($id, $request->validated());
    }

    public function deleteinformes($id)
    {
        return $this->informesRepository->deleteinformes($id);
    }
}