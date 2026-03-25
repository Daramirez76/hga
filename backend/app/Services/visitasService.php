<?php

namespace App\Services;

use App\Http\Requests\visitasRequest;
use App\Repositories\Interfaces\visitasInterface;

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

    public function create(visitasRequest $request)
    {
        return $this->visitasRepository->createvisitas($request->validated());
    }

    public function update($id, visitasRequest $request)
    {
        return $this->visitasRepository->updatevisitas($id, $request->validated());
    }

    public function delete($id)
    {
        return $this->visitasRepository->deletevisitas($id);
    }
}
