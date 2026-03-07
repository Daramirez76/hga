<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class residentesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

public function rules(): array
{
    $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

    return [
       'cod_residente' => $isUpdate ? 'sometimes|required|integer' : 'required|integer',
       'nombre' => $isUpdate ? 'sometimes|required|string|max:255' : 'required|string|max:255',
       'apellido' => $isUpdate ? 'sometimes|required|string|max:50' : 'required|string|max:50',
       'edad' => $isUpdate ? 'sometimes|required|integer|min:0' : 'required|integer|min:0',
       'patologia' => $isUpdate ? 'sometimes|required|string|max:120' : 'required|string|max:120',
       'RH' => $isUpdate ? 'sometimes|required|string|max:6' : 'required|string|max:6',
       'cod_usuario' => $isUpdate ? 'sometimes|required|integer' : 'required|integer',
       'cod_rol' => $isUpdate ? 'sometimes|required|integer' : 'required|integer'
    ];
}
}     
