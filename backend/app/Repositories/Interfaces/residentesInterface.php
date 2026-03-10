<?php
namespace App\Repositories\Interfaces;

use Illuminate\Foundation\Http\FormRequest;

interface residentesInterface
{
    public function getAllresidentes();
    public function getresidentesById($id);
    public function createresidentes(array $data);
    public function updateresidentes($id, array $data);
    public function deleteresidentes($id);
}