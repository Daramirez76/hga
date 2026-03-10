<?php

namespace App\Services;

use App\Http\Requests\visitasRequest;
use App\repositories\Interfaces\visitasRepository;

class visitasService
{
    protected $visitasRepository;

    public function __construct(visitasInterface $visitasRepository)
    {
        $this->visitasRepository = $visitasRepository;
    }
  
    public function getAllvisitas()
    {
        return $this->visitasRepository->getAllvisitas();
    }

    public function getvisitasById($id)
    {
        return $this->visitasRepository->getvisitasById($id);
    }

    public function createvisitas(visitasRequest $request)
    {
        return $this->visitasRepository->createvisitas($request->validated());
    }

    public function updatevisitas($id, visitasRequest $request)
    {
        return $this->visitasRepository->update($id, $request->validated());
    }

    public function deletevisitas($id)
    {
        return $this->visitasRepository->delete($id);
    }
}
