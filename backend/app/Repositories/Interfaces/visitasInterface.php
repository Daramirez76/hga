<?php
namespace App\Repositories\Interfaces;

use Illuminate\Foundation\Http\FormRequest;

interface visitasInterface
{
    public function getAllvisitas();
    public function getvisitasById($id);
    public function createvisitas(array $data);
    public function updatevisitas($id, array $data);
    public function deletevisitas($id);
}